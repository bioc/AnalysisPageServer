make.args.listener <- function()  {
  args <- NULL
  function(...)  {
    args <<- list(...)
    invisible()
  }
}

reset.args <- function(listener)  {
  environment(listener)$args <- NULL
}

last.args <- function(listener)  {
  environment(listener)$args
}


test.check.memory <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  check.memory <- AnalysisPageServer:::check.memory
  
  events <- new.event.registry()

  add.event(events, "BloatedMemory")
  listener <- make.args.listener()
  add.event.handler(events, "BloatedMemory",
                    listener)

  current.gc <- gc()
  current.used <- sum(current.gc[, 2])

  check.memory(events,
               max.mb = current.used * 2)

  checkEquals(last.args(listener),
              NULL,
              "event is not triggered when max.mb is bigger than current used Mb")


  reset.args(listener)
  
  check.memory(events,
               max.mb = current.used / 2)

  checkEquals(last.args(listener),
              list(used.mb = current.used,
                   max.mb = current.used / 2),
              "event is triggered when max.mb is less than current used Mb")
}



test.bind.memory.checker <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  bind.memory.checker <- AnalysisPageServer:::bind.memory.checker

  
  for(thresh in c("low", "high"))  {
    dir.create(td <- tempfile())
    app <- AnalysisPageServer:::rapache.trig.app(tmpdir = td)

    max.mb <- if(thresh == "low") 0 else 1e8
    bind.memory.checker(app, max.mb = max.mb)

    ## Now set up BloatedMemory listener
    L <- make.args.listener()
    add.event.handler(app$events, "BloatedMemory", L)
      
    ## Now call analysis
    GET <<- POST <<- FILES <<- list()
    setContentType <<- function(...) {}
    on.exit(rm("GET", "POST", "FILES", "setContentType", pos=.GlobalEnv))

    reset.args(L)

    ## This is a hack to make it trigger the FinishAnalysis event
    app$in.analysis <- TRUE
    capture.output(app$process.response(body="abcd", content.type="text/html"))

    expected.event.args <- if(thresh == "low")  {
      list(used.mb = sum(gc()[,2]),
           max.mb = max.mb)
    }  else  {
      NULL
    }

      
    checkEquals(last.args(L),
                expected.event.args,
                tol = 0.01)
  }
}
                 


test.autosignal.on.bloated.memory <- function()  {
  if(platformIsWindows())  {
    message("Skipping autosignal.on.bloated.memory on windows")
    return()
  }
  
  library(AnalysisPageServer)
  library(RUnit)

  events <- new.event.registry()
  add.event(events, "BloatedMemory")


  check.signal(trigger.event(events, "BloatedMemory"),
               signo = tools::SIGUSR1,
               no.signal = TRUE)

  
  ## Set up a listener on BloatedMemory that signals SIGUSR1 to itself.
  AnalysisPageServer:::autosignal.on.bloated.memory(events)
                               
  check.signal(trigger.event(events, "BloatedMemory"),
               signo = tools::SIGUSR1)

 
}

test.protect.rapache.memory <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  if(platformIsWindows())  {
    message("Skipping autosignal.on.bloated.memory on windows")
    return()
  }
  


  bind.memory.checker <- AnalysisPageServer:::bind.memory.checker
  
  for(thresh in c("low", "high"))  {
    dir.create(td <- tempfile())
    app <- AnalysisPageServer:::rapache.trig.app(tmpdir = td)

    max.mb <- if(thresh == "low") 0 else 1e8

    protect.rapache.memory(app, max.mb = max.mb)

    GET <<- POST <<- FILES <<- list()
    setContentType <<- function(...) {}
    on.exit(rm("GET", "POST", "FILES", "setContentType", pos=.GlobalEnv))

    app$in.analysis <- TRUE
    check.signal(capture.output(app$process.response(body="abcd", content.type="text/html")),
                 signo = tools::SIGUSR1,
                 no.signal = (thresh == "high"))
  }
}

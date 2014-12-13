test.eval.within.time <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  if(platformIsWindows())  {
    message("Skipping test.eval.within.time on windows")
    return()
  }

  value <- eval.within.time({1}, 10)
  checkEquals(value, 1)

  dies.ok(
          eval.within.time({Sys.sleep(5); 1}, 0.1)
          , "Timeout after 0.1 secs")


  dies.ok(
          eval.within.time({stop("foo")}, 10)
          , "foo")

  death.time <- system.time(try(eval.with.time({stop("foo")}, 10), silent = TRUE))["elapsed"]
  checkTrue(death.time < 0.1, "Child throws error -> parent harvests quickly")

  errobj <- try(stop("foo"), silent = TRUE)
  got <- lives.ok(eval.within.time({errobj}, 1),
                  "child returns but does not throw error object -> parent does not throw it")
  
  checkEquals(got, errobj,
              "child returns but does not throw error object -> parent returns it")
  
  if(FALSE)  {
    ## I don't know a portable way to do this, but I can at least step through to run
    ## the test manually on my laptop
    parent.pid <- getpid()
    lines <- readLines(pipe(paste("ps -eaf")))
    nc <- nchar(sub(" CMD$", "", lines[1]))
    ## process table
    pt <- read.table(textConnection(sub("^ +", "", substr(lines, 1, nc))), header = TRUE)
    pt$CMD <- substr(lines[-1], nc+1, nchar(lines))

    children <- pt[pt$PPID == parent.pid,]
    ## should only have 1 child -- the ps -eaf process
    checkTrue(nrow(children) == 1)
    checkEquals(children$CMD, " ps -eaf")
  }
}

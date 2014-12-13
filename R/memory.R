## this file contains add-on functions to have AnalysisPageServer
## keep an eye on what memory it is using, and to throw SIGUSR1 to itself when it goes over a limit.


##' Check memory usage and trigger an event if it exceeds some threshold.
##'
##' Call \code{gc()} to check memory,
##' possibly print the result to STDERR, then possibly
##' call the next handler you supply if too much memory is being
##' used.
##' @title check.memory
##' @param events EventRegistry object
##' @param max.mb If the total "used" memory (Ncells + Vcells) is at least this much
##' (in Mb) then trigger the next handler.
##' @param logger log4r object. If non-NULL then memory usage is printed there with \code{info()}. Default: NULL, don't log.
##' @param event.name Name of the event to trigger. Default: "BloatedMemory".
##' It is passed \code{used.mb} and \code{max.mb} arguments
##' @return Nothing
##' @author Brad Friedman
check.memory <- function(events,
                         max.mb,
                         logger = NULL,
                         event.name = "BloatedMemory")  {

  usage <- gc()
  used.mb <- sum(usage[, 2])

  if(!is.null(logger))  {
    info(logger, paste("Checking memory of worker process", Sys.getpid()))
    for(line in capture.output(usage))
      info(logger, line)
  }

  
  if(used.mb > max.mb)  {
    if(!is.null(logger))
      info(logger,
           sprintf("Used Mb (%s) exceeds limit (%s)...triggering %s event", used.mb, max.mb, event.name))

    trigger.event(events, event.name,
                  used.mb = used.mb,
                  max.mb = max.mb)
  }  else  {
    if(!is.null(logger))
      info(logger,
           sprintf("Used Mb (%s) does not exceed limit (%s)...NOT triggering %s event", used.mb, max.mb, event.name))
  }
}


##' Bind the memory checker to the FinishAnalysis event
##'
##' You supply an AnalysisPageRApacheApp. It also has a FinishAnalysis
##' event. I add a new event (by default called BloatedMemory), and
##' also a listener for FinishAnalysis, which calls \code{\link{check.memory}}
##' each time \code{FinishAnalysis} is triggered.
##' (this will then trigger BloatedMemory if memory usage is above threshold).
##' Although the BloatedMemory event would now be triggered, unless a listener
##' is attached to *it* nothing special will happen.
##' (See \code{\link{autosignal.on.bloated.memory}} for this.)
##' @title bind.
##' @param app AnalysisPageRApacheApp
##' @param max.mb Memory threshold for triggering BloatedMemory, in Megabytes. Required.
##' @param app.event Name of existing event on which the new memory check listener should
##' be registered. Default: "FinishAnalysis".
##' @param memory.event Name of event to fire in case of memory usage above threshold.
##' Default: "BloatedMemory".
##' @return Nothing of note.
##' @author Brad Friedman
##' @seealso \code{\link{check.memory}}, \code{\link{autosignal.on.bloated.memory}}
bind.memory.checker <- function(app,
                                max.mb,
                                app.event = "FinishAnalysis",
                                memory.event = "BloatedMemory")  {
  add.event(app$events, memory.event)

  add.event.handler(app$events,
                    app.event,
                    function(...)  {
                      ## I am ignoring the FinishAnalysis parameters ...
                      ## This just ties the functionality to the end of the request.
                      check.memory(app$events,
                                   max.mb = max.mb,
                                   logger = app$logger,
                                   event.name = memory.event)
                    })
}


##' Send signal to self on BloatedMemory
##'
##' Have the process send a signal to itself when BloatedMemory event is triggered.
##' @title autosignal.on.bloated.memory
##' @param events EventRegistry object
##' @param signal Signal to throw. Default is SIGUSR1 (defined in tools package). Normally this elicits similar behavior to SIGINT
##' however when running inside Apache it lets the worker process finish the current request
##' before killing itself.
##' @param pid Process ID to which the signal should be sent. Default: \code{Sys.getpid()}, the current process. (If you
##' provide something else it is no longer really an \code{autosignal}, just a \code{signal}).
##' @param logger log4r object, optional
##' @param event.name Name of event to listen for. Default: "BloatedMemory"
##' @return Nothing
##' @note This attaches a listener---it does not actaully do anything until the BloatedMemory event is triggered, if ever.
##' @author Brad Friedman
##' @importFrom tools pskill
autosignal.on.bloated.memory <- function(events,
                                         signal = tools::SIGUSR1,
                                         pid = Sys.getpid(),
                                         logger = NULL,
                                         event.name = "BloatedMemory")  {
  add.event.handler(events,
                    event.name,
                    function(used.mb, max.mb)  {
                      if(!is.null(logger))  {
                        info(logger, sprintf("%s event caught with used.mb=%s > max.mb=%s", event.name, used.mb, max.mb))
                        info(logger, sprintf("Throwing signal %s to self" ,signal))
                      }
                      pskill(pid, signal = signal)
                    })
}



##' Set up events and handler to turn over memory-bloated worker processes
##'
##' Set up events and handler to turn over memory-bloated worker processes.
##' When Rapache processes process requests that require large amounts of memory
##' they don't return the memory to the OS. Eventually it can build up, slowing
##' down the server when then has to turn to cache. Calling this function
##' will add a check at each FinishAnalysis which, if the process is using
##' more memory than the threshold specified by \code{max.mb}, delivers
##' a SIGUSR1 signal to itself. This is a signal to Apache that the process
##' should be turned over after finish the current request, thus
##' pruning bloated workers.
##' @title protect.rapache.memory
##' @param app AnalysisPageRApacheApp
##' @param max.mb Maximum allowed memory usage before triggering turnover.
##' @param app.event Name of event which should trigger this memory check.
##' Default: "FinishAnalysis".
##' @param memory.event Name of event which excess memory usage should trigger.
##' Default: "BloatedMemory".
##' @return Nothing
##' @author Brad Friedman
##' @export
protect.rapache.memory <- function(app,
                                   max.mb,
                                   app.event = "FinishAnalysis",
                                   memory.event = "BloatedMemory")  {
  bind.memory.checker(app = app,
                      max.mb = max.mb,
                      app.event = app.event,
                      memory.event = memory.event)
  
  autosignal.on.bloated.memory(app$events,
                               signal = tools::SIGUSR1,
                               pid = Sys.getpid(),
                               logger = app$logger,
                               event.name = memory.event)
}

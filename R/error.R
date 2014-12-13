## The tryKeepTraceback and getTraceback functions are stolen from HTSeqGenie
## Authors are I think Gregoire Pau and/or Jens Reeder
## Then modified and the other stuff by me, Brad Friedman

##' Try-catch wrapper, keeping error traceback and conditions
##'
##' This is a try-catch wrapper. It returns a list with
##' four elements:
##' \describe{
##'   \item{\code{$value}}{The value of the evaluated expression, or NULL if an error was thrown and execution did not complete}
##'   \item{\code{$messages}}{A list of \code{message} objects, each being a message thrown during the execution, in order}
##'   \item{\code{$warnings}}{A list of \code{condition} objects, each being a message thrown during the execution, in order}
##'   \item{\code{$error}}{NULL if there was no error, otherwise the \code{error} object, which can then be passed to \code{getTraceback}
##'         to retrieve the error}
##' }
##'
##' The elements of the \code{$messages}, \code{$warnings} and \code{$error} are all actually two-element lists, the first being
##' the condition object itself (named \code{$message}, \code{$warning} or \code{$error}) and the second begin the call stack
##' as returned by \code{sys.calls()} and named \code{$calls}.
##' 
##' The class of this object is set as "AnalysisPageValueWithConditions"
##' @title tryKeepConditions
##' @param expr Expression to evaluate
##' @return AnalysisPageValueWithConditions
##' @author Brad Friedman
##' @seealso \code{vwc.is.error}
##' @export
##' @seealso \code{\link{vwc.conditions}} \code{\link{vwc.error}} \code{\link{vwc.error.condition}} \code{\link{vwc.error.traceback}} \code{\link{vwc.is.error}} \code{\link{vwc.messages}} \code{\link{vwc.messages.conditions}} \code{\link{vwc.messages.tracebacks}} \code{\link{vwc.n}} \code{\link{vwc.n.messages}} \code{\link{vwc.n.warnings}} \code{\link{vwc.tracebacks}} \code{\link{vwc.value}} \code{\link{vwc.warnings}} \code{\link{vwc.warnings.conditions}} \code{\link{vwc.warnings.tracebacks}}
##' @aliases AnalysisPageValueWithConditions
##' @examples
##' value.with.warning <- tryKeepConditions({warning("warning message"); 3})
##' value.with.error <- tryKeepConditions({stop("err message")})
tryKeepConditions <- function(expr)  {
  conditions <- list(messages = list(),
                     warnings = list(),
                     error = NULL)
  value <- withCallingHandlers(tryKeepTraceback(expr),
                               message = function(m)  {
                                 conditions$messages <<- c(conditions$messages, list(list(message = m, calls = sys.calls())))
                                 invokeRestart("muffleMessage")
                               },
                               warning = function(w)  {
                                 conditions$warnings <<- c(conditions$warnings, list(list(warning = w, calls = sys.calls())))
                                 invokeRestart("muffleWarning")
                               })

  if(is(value, "try-error"))  {
    conditions$error <- value
    value <- NULL
  }

  ## This list(value = value) is important.
  ## If value is not a list then you can get away with just c(value = value, conditions)
  ## but if it is a list then it will be concatenated at the top level, so you will get
  ## a surprise where all the elements of value are there at the top level along with
  ## the conditions elements.
  retval <- c(list(value = value),
              conditions)

  ## Remove the last call from the stack, which is always going to be just function(m) or function(w)
  ## from the handler function
  for(condition.type in c("messages", "warnings"))
    retval[[condition.type]] <- lapply(retval[[condition.type]], function(cond)  {
      cond$calls[[length(cond$calls)]] <- NULL
      cond
    })
  class(retval) <- "AnalysisPageValueWithConditions"

  return(retval)
}

##' Get value of any AnalysisPageValueWithConditions
##'
##' Get value of any AnalysisPageValueWithConditions. If an error was thrown
##' then the value will be NULL.
##' @title vwc.value
##' @param vwc AnalysisPageValueWithConditions
##' @return Value of original evaluated expression, or NULL if an error was thrown.
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({3+5})
##' vwc.value(vwc)
vwc.value <- function(vwc)  {
  stopifnot(is(vwc, "AnalysisPageValueWithConditions"))
  return(vwc$value)
}


##' Predicate to test if an AnalysisPageValueWithConditions had an error
##'
##' Predicate to test if an AnalysisPageValueWithConditions had an error
##' @title vwc.is.error
##' @param vwc AnalysisPageValueWithConditions, as returned by \code{\link{tryKeepConditions}}
##' @return Logical
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({3+5})
##' vwc.is.error(vwc)
##'
##' vwc <- tryKeepConditions({stop("error!")})
##' vwc.is.error(vwc)
vwc.is.error <- function(vwc)  {
  stopifnot(is(vwc, "AnalysisPageValueWithConditions"))
  is(vwc$error, "try-error")
}


##' Return condition object(s) for an AnalysisPageValueWithConditions
##'
##' Return condition object(s) for an AnalysisPageValueWithConditions
##' @title vwc.conditions
##' @param vwc AnalysisPageValueWithConditions
##' @param type "messages" "warnings" or "error"
##' @return List of condition objects for "messages" or "warnings"
##' or a single condition object or NULL for "error".
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{vwc.error.condition}},
##' \code{\link{vwc.messages.conditions}},
##' \code{\link{vwc.warnings.conditions}}
##' @examples
##' vwc <- tryKeepConditions({message("whatever"); warning("warning message"); 3})
##' vwc.conditions(vwc, "messages")
##' vwc.conditions(vwc, "warnings")
##' vwc.conditions(vwc, "error")
vwc.conditions <- function(vwc, type = "messages")  {
  stopifnot(is(vwc, "AnalysisPageValueWithConditions"))
  stopifnot(type %in% c("messages", "warnings", "error"))
  if(type == "error")  {
    return(vwc$error[[1]])
  }  else  {
    lapply(vwc[[type]], "[[", 1)
  }
}

##' Get condition object for error
##'
##' Get condition object for error
##' @title vwc.error.condition
##' @param vwc AnalysisPageValueWithCondition
##' @return condition object for error, or NULL
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({stop("error!")})
##' vwc.error.condition(vwc)
vwc.error.condition <- function(vwc)  {
  vwc.conditions(vwc, "error")
}

##' Get condition object for warnings
##'
##' Get condition object for warnings
##' @title vwc.warnings.conditions
##' @param vwc AnalysisPageValueWithCondition
##' @return List of condition object for warnings (might be of length 0 if
##' no warnings were thrown).
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({warning("I'm warning you!")})
##' vwc.warnings.conditions(vwc)
vwc.warnings.conditions <- function(vwc)  {
  vwc.conditions(vwc, "warnings")
}

##' Get condition object for messages
##'
##' Get condition object for messages
##' @title vwc.messages.conditions
##' @param vwc AnalysisPageValueWithCondition
##' @return List of condition objects for messages (might be of length 0)
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({message("I've got something to say.")})
##' vwc.messages.conditions(vwc)
vwc.messages.conditions <- function(vwc)  {
  vwc.conditions(vwc, "messages")
}

##' Return condition Messages for an AnalysisPageValueWithConditions
##'
##' Return condition Messages for an AnalysisPageValueWithConditions.
##' @title vwc.messages
##' @param vwc AnalysisPageValueWithConditions
##' @param type Type of conditions. Must be "messages" or "warnings".
##' Default: messages.
##' @return Charvec of message strings
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({message("I've got something to say.")})
##' vwc.messages(vwc)
vwc.messages <- function(vwc, type="messages")  {
  stopifnot(is(vwc, "AnalysisPageValueWithConditions"))
  stopifnot(type %in% c("messages", "warnings", "error"))

  if(type == "error")  {
    return(conditionMessage(vwc$error$error))
  }  else  {
    mesgs <- sapply(vwc[[type]], function(cond) conditionMessage(cond[[1]]))
    if(length(mesgs) > 0)  {
      return(mesgs)
    }  else  {
      ## If there are no messages then the sapply will return list(),
      ## but we want to always return a charvec
      return(character(0))
    }
              
  }
}




##' Access warning messages from AnalysisPageValueWithConditions
##'
##' Access warning messages from AnalysisPageValueWithConditions
##' @title vwc.warnings
##' @param vwc AnalysisPageValueWithConditions
##' @return Charvec of warning messages
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({warning("I'm warning you!"); warning("Again")})
##' vwc.warnings(vwc)
vwc.warnings <- function(vwc)  vwc.messages(vwc, "warnings")

##' Access error message from AnalysisPageValueWithConditions
##'
##' Access error message from AnalysisPageValueWithConditions
##' @title vwc.error
##' @param vwc AnalysisPageValueWithConditions
##' @return Charvec of warning messages
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({stop("This isn't going to work")})
##' vwc.error(vwc)
vwc.error <- function(vwc)  vwc.messages(vwc, "error")


##' Get number of conditions of a given type for an AnalysisPageValueWithConditions
##'
##' Get number of conditions of a given type for an AnalysisPageValueWithConditions.
##' @title vwc.n
##' @param vwc AnalysisPageValueWithConditions
##' @param type "messages", "warnings" or "error"
##' @return Number of conditions. (For "error" it can only be 0 or 1, and is equivalent
##' to calling \code{as.integer(\link{vwc.is.error}())}).
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({stop("This isn't going to work")})
##' vwc.n(vwc, "error")
vwc.n <- function(vwc, type)  {
  stopifnot(is(vwc, "AnalysisPageValueWithConditions"))
  stopifnot(type %in% c("messages", "warnings", "error"))
  return(length(vwc[[type]]))
}

##' Get number of messages for an AnalysisPageValueWithConditions
##'
##' Get number of messages for an AnalysisPageValueWithConditions
##' @title vwc.n.messages
##' @param vwc AnalysisPageValueWithConditions
##' @return Non-negative Integer
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({message("Message")})
##' vwc.n.messages(vwc)
vwc.n.messages <- function(vwc) vwc.n(vwc, "messages")

##' Get number of warnings for an AnalysisPageValueWithConditions
##'
##' Get number of warnings for an AnalysisPageValueWithConditions
##' @title vwc.n.warnings
##' @param vwc AnalysisPageValueWithConditions
##' @return Non-negative Integer
##' @author Brad Friedman
##' @export
##' @examples
##' vwc <- tryKeepConditions({warning("I'm warning you.")})
##' vwc.n.warnings(vwc)
vwc.n.warnings <- function(vwc) vwc.n(vwc, "warnings")


##' Return traceback(s) for an AnalysisPageValueWithConditions
##'
##' Return traceback(s) for an AnalysisPageValueWithConditions
##' @title vwc.tracebacks
##' @param vwc AnalysisPageValueWithConditions
##' @param type Type of conditions. Must be "messages", "warnings" or "error".
##' Default: "messages". A (new) error is thrown if type is "error" but
##' the \code{vwc} is not an error (that is, does not have an error, or
##' more specifically, \code{!vwc.is.error(vwc)}).
##' @return For "messages" or "warnings" it gives
##' a list of Charvecs of tracebacks, as built by \code{\link{getTraceback}}.
##' For "error" it only gives a single charvec, since there is only one error.
##' @author Brad Friedman
##' @export
##' @examples
##' f <- function(msg)  {
##'   warning(msg)
##' }
##' vwc <- tryKeepConditions({
##'   f("foo")
##'   f("bar")
##' })
##' vwc.tracebacks(vwc, "warnings")
vwc.tracebacks <- function(vwc, type="messages")  {
  stopifnot(is(vwc, "AnalysisPageValueWithConditions"))
  stopifnot(type %in% c("messages", "warnings", "error"))

  if(type == "error")  {
    stopifnot(vwc.is.error(vwc))
    tb <- getTraceback(vwc$error)
    return(tb)
  }  else  {
    tbs <- lapply(vwc[[type]], function(cond) getTraceback(cond))
    return(tbs)
  }
}

##' Get list of messages tracebacks
##'
##' Get list of tracebacks for messages.
##' @title vwc.messages.tracebacks
##' @param vwc AnalysisPageValueWithConditions
##' @return List of charvecs.
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{vwc.tracebacks}}
##' @examples
##' f <- function(msg)  {
##'   message(msg)
##' }
##' vwc <- tryKeepConditions({
##'   f("foo")
##'   f("bar")
##' })
##' vwc.messages.tracebacks(vwc)
vwc.messages.tracebacks <- function(vwc)  vwc.tracebacks(vwc, "messages")

##' Get list of warnings tracebacks
##'
##' Get list of tracebacks for warnings.
##' @title vwc.warnings.tracebacks
##' @param vwc AnalysisPageValueWithConditions
##' @return List of charvecs.
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{vwc.tracebacks}}
##' @examples
##' f <- function(msg)  {
##'   warning(msg)
##' }
##' vwc <- tryKeepConditions({
##'   f("foo")
##'   f("bar")
##' })
##' vwc.warnings.tracebacks(vwc)
vwc.warnings.tracebacks <- function(vwc)  vwc.tracebacks(vwc, "warnings")



##' Get traceback for error
##'
##' Get traceback for error
##' @title vwc.error.traceback
##' @param vwc AnalysisPageValueWithConditions
##' @return Charvecs, or NULL if there was no error.
##' (In this it differs from \code{\link{vwc.tracebacks}}, which
##'  throws an error).
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{vwc.tracebacks}}
##' @examples
##' f <- function(msg)  {
##'   stop(msg)
##' }
##' vwc <- tryKeepConditions({
##'   f("foo")
##' })
##' vwc.error.traceback(vwc)
vwc.error.traceback <- function(vwc)  {
  if(vwc.is.error(vwc))  {
    return(vwc.tracebacks(vwc, "error"))
  }  else  {
    return(NULL)
  }
}




##' Wrapper around try-catch
##'
##' @title tryKeepTraceback
##' @param expr Expression to evaluate
##' @return Result of expression or error if thrown
##' @export
##' @examples
##' x <- tryKeepTraceback(stop("no way"))
##' if(is(x, "try-error"))  cat(getTraceback(x))
tryKeepTraceback <- function(expr) {
  withRestarts(withCallingHandlers(expr,
                                   error=function(e) {
                                     error <- e
                                     calls <- sys.calls()
                                     invokeRestart("myAbort", e, calls)
                                   }),
               myAbort=function(e, calls){
                 err <- list(error=e, calls=calls)
                 class(err) <- c("try-error")
                 return(err)
               })
}

##' Get traceback from tryKeepTraceback()
##'
##' @title getTraceback
##' @param mto An object of the try-error class
##' @return Traceback as a string
##' @export
##' @examples
##' x <- tryKeepTraceback(stop("no way"))
##' if(is(x, "try-error"))  cat(getTraceback(x))
getTraceback <- function(mto) {
  ## get trace
  trace <- lapply(mto$calls, function(call) {
    z = format(call)[1]
    attr(z, "srcref") <- attr(call, "srcref")
    z
  })
  
  ## reverse trace
  trace <- trace[length(trace):1]

  ## skip error handler calls
  skipFunctions <- c("withRestarts", "withCallingHandlers", "invokeRestart", "withOneRestart",
                     "tryKeepTraceback",
                     "tryKeepConditions",
                     "signalCondition",
                     ".signalSimpleWarning",
                     "doWithOneRestart", ".handleSimpleError", "simpleError",
                     "doTryCatch", "tryCatchOne", "tryCatchList", "tryCatch", "sendMaster")
  utrace <- unlist(trace)
  z <- unique(unlist(sapply(1:length(skipFunctions), function(i) grep(skipFunctions[i], utrace))))
  trace <- trace[-z]

  ## build trace using traceback()
  capture.output(traceback(trace))
}

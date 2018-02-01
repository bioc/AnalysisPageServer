test.error <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  

  vwc <- tryKeepConditions({
    stop("an error")
  })

  checkTrue(vwc.is.error(vwc))

  checkEquals(vwc.error(vwc), "an error")

  checkEquals(vwc.n.warnings(vwc), 0)
  checkEquals(vwc.n.messages(vwc), 0)
  checkEquals(vwc.value(vwc), NULL)
  
  throwmywarn <- function(i)  {
    warning("This is my warning ", i)
  }

  
  sendmymessage <- function(i)  {
    message("This is my message ", i)
  }

  vwc <- tryKeepConditions({
    throwmywarn(1)
    throwmywarn(2)
    sendmymessage(1)
    sendmymessage(2)
    42
  })

  checkTrue(!vwc.is.error(vwc))

  checkEquals(vwc.messages(vwc),
              c("This is my message 1\n", "This is my message 2\n"))
  checkEquals(vwc.warnings(vwc),
              c("This is my warning 1", "This is my warning 2"))

  checkEquals(vwc.n.warnings(vwc), 2)
  checkEquals(vwc.n.messages(vwc), 2)
  checkEquals(vwc.n(vwc, "error"), 0)
  
  checkEquals(vwc.value(vwc), 42)

  ## The actual stack trace depends on the context in which the test
  ## is run----so it could have just the expected stack, the expected
  ## stack with teh function test.error(), or maybe also functions
  ## from the test harness. So strip the prefixes (which number the
  ## entries in the stack) and only compare the top of the stack.
  ## Also need to strip the line numbers which will depend on the
  ## context
  check.traceback <- function(got, expstack)  {
    ## same number of warnings or messages
    checkEquals(length(got), length(expstack))

    for(i in 1:length(got))  {
      top.of.stack <- head(got[[i]], length(expstack[[i]]))
      top.of.stack.no.prefix <- sub(".*: ", "", top.of.stack)
      ## [^#]* allows this to work in the context of having source references on
      ## Thanks to Tomas Kalibera
      top.of.stack.no.linenum <- sub(" at [^#]*#\\d+$", "", top.of.stack.no.prefix)

      checkEquals(top.of.stack.no.linenum,
                  expstack[[i]],
                  paste("stack", i))
    }
  }
  
  check.traceback(vwc.warnings.tracebacks(vwc),
                  list(c("warning(\"This is my warning \", i)",
                         "throwmywarn(1)"),
                       c("warning(\"This is my warning \", i)",
                         "throwmywarn(2)")))

  check.traceback(vwc.messages.tracebacks(vwc),
                  list(c("message(\"This is my message \", i)",
                         "sendmymessage(1)"),
                       c("message(\"This is my message \", i)",
                         "sendmymessage(2)")))

  
}


if(FALSE)  {
    ## This test is not written yet

test.warning.object <- function()  {
  library(AnalysisPageServer)


  APSWarning <- function(obj)  {
    class(obj) <- c("APSWarning", "warning", "condition")
    obj
  }
  
  obj <- list(type = "simple-warning", message = "This is just a warning")
  vwc <- tryKeepConditions({
    warning(APSWarning(obj))
  })

  vwc.warnings(vwc)
}
}

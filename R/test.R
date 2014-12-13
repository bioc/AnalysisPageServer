##' Test that an expression lives OK
##'
##' Test that evaluating an expression lives OK (does not throw an exception)
##' @title lives.ok
##' @param call An expression to evaluate
##' @param testname A name for the test. Defaults to deparsing the call.
##' @return Runs one test. Returns the value of the evaluated expression
##' @author Brad Friedman
##' @export
##' @examples
##' lives.ok(3+5, "addition lives OK")
lives.ok <- function(call, testname)  {
  if(missing(testname))  testname <- deparse(substitute(call))

  lived <- tryCatch({
    value <- eval(call)
    list(TRUE,value)
  }, error=function(e)  {
    list(FALSE, e$message)
  })
  if(!lived[[1]])  cat(file=stderr(), "Error message for lives.ok: ", lived[[2]], "\n")
  RUnit::checkTrue(lived[[1]], paste(sep=": ", testname, "lives OK"))
  invisible(lived[[2]])
}


##' Test that an expression throws an error
##'
##' Test that an expression throws an error.
##' @title dies.ok
##' @param call An expression to evaluate
##' @param regex A regular expression to match the error against. If omitted then don't test the exception text.
##' @param testname A name for the test. Defaults to deparsing the call.
##' @return Runs one or two tests (the second test to match the error message against regex, if it was provided and
##' if an error was successfully thrown).
##' @author Brad Friedman
##' @export
##' @examples
##' dies.ok(stop("foo"), "foo", "it stops")
dies.ok <- function(call, regex, testname)  {
  if(missing(testname))  testname <- deparse(substitute(call))

  threw.error.and.message <- tryCatch({
    eval(call)
    list(FALSE, "")  ## no error
  }, error=function(e)  {
    list(TRUE, e$message)
  })

  threw.error <- threw.error.and.message[[1]]
  error.message <- threw.error.and.message[[2]]
  
  RUnit::checkTrue(threw.error, paste(testname, "threw an error"))
  if(threw.error && !missing(regex))  {
    RUnit::checkTrue(grepl(regex, error.message),
                     paste(sep="", testname, ": error message matches /", regex, "/: ", error.message))
  }
}


start.catching <- function(signo)  {
  .C("R_start_catching", as.integer(signo),
     PACKAGE = "AnalysisPageServer")
}

stop.catching <- function(signo)  {
  .C("R_stop_catching", as.integer(signo),
     PACKAGE = "AnalysisPageServer")
}

last.catch <- function()  {
  got <- .C("R_last_catch", integer(1), integer(1),
            PACKAGE = "AnalysisPageServer")
  if(got[[1]] == 0)  return(NULL)
  return(got[[2]])
}

##' Check if an expression results in a signal being delivered
##'
##' Check if an expression results in a signal being delivered.
##' The signal will be caught: you can safely deliver a signal
##' such as SIGUSR1 that would normally cause the process to die.
##' @title check.signal
##' @param expr The expression to evaluate
##' @param signo The signal number (consider using constants
##' like SIGUSR1 from the tools package).
##' @param testname Name for this test. Default is to build from
##' signo argument.
##' @param no.signal Logical, to invert the sense of the test.
##' Default, FALSE, means to test that the signal was delivered.
##' TRUE means to test that the signal was not delivered.
##' @return The value of the evaluated expression, invisibly,
##' so you can do more testing if desired.
##' @author Brad Friedman - Regular
##' @export
check.signal <- function(expr, signo,
                         testname,
                         no.signal = FALSE)  {

  if(missing(testname))  {
    signo.str <- deparse(substitute(signo))

    sent <- if(no.signal) "not sent" else "sent"
    testname <- paste("signal", signo.str, "was", sent)
  }
  
  start.catching(signo)
  on.exit(stop.catching(signo))

  got <- eval(expr)

  caught.signo <- last.catch()
  
  if(no.signal)  {
    RUnit::checkTrue(is.null(caught.signo), testname)
  }  else  {
    RUnit::checkEquals(caught.signo, signo, testname)
  }

  invisible(got)
}

##' Run the RUnit test harness for this package
##'
##' Run the RUnit test harness for this package
##' @title test.package
##' @return RUnitTestData
##' @author Brad Friedman, Cory Barr
##' @seealso \code{\link[RUnit]{runTestSuite}}, \code{\link[base]{require}}
##' @export
##' @param pattern String. Regular expression. Only filenames matching
##' this expression will be included in the test harness. Default:
##' \code{"^test.*R$"}.
test.package <- function(pattern = "^test.*R$")  {
  package <- "AnalysisPageServer"

  require(RUnit) || stop("Couldn't load package 'RUnit'")
  
  ## This next line makes it possible to just have the whole
  ## test driver be AnalysisPageServer::test.package("packagename")
  require(package, character.only = TRUE) || stop("Couldn't load package '", package, "'")

  if(missing(pattern))  {  
    argv <- commandArgs(trailingOnly=TRUE)
    if(length(argv) > 0)  {
      pattern <- argv[1]
      ends.in.dollar <- grepl("\\$$", pattern)
      if(!ends.in.dollar)  pattern <- paste(sep="", pattern, ".*R$")
    }
  }
  
  .failure_details <- function(result) {
    res <- result[[1L]]
    if (res$nFail > 0 || res$nErr > 0) {
      Filter(function(x) length(x) > 0,
             lapply(res$sourceFileResults,
                    function(fileRes) {
                      names(Filter(function(x) x$kind != "success",
                                   fileRes))
                    }))
    } else list()
  }
  
  dir <- system.file("unitTests", package=package)
  if (!length(dir))
    stop("unable to find unit tests, no 'unitTests' dir")
  
  RUnit_opts <- getOption("RUnit", list())
  RUnit_opts$verbose <- 0L
  RUnit_opts$silent <- TRUE
  RUnit_opts$verbose_fail_msg <- TRUE
  options(RUnit = RUnit_opts)
  cat(sep="", "\nPattern = /", pattern, "/\n")
  cat("\nMatching test files:\n", paste(collapse="\n  ", paste(sep="/", dir, grep(pattern, dir(dir), value=TRUE))), "\n\n")
  suite <- defineTestSuite(name=paste(package,"RUnit Tests"), dirs=dir,
                           testFileRegexp=pattern,
                           rngKind="default",
                           rngNormalKind="default")
  result <- runTestSuite(suite, verbose=TRUE)
  cat("\n\n")
  printTextProtocol(result, showDetails=FALSE)
  if (length(details <- .failure_details(result)) >0) {
    cat("\nTest files with failing tests\n")
    for (i in seq_along(details)) {
      cat("\n  ", basename(names(details)[[i]]), "\n")
      for (j in seq_along(details[[i]])) {
        cat("    ", details[[i]][[j]], "\n")
      }
    }
    cat("\n\n")
    stop("unit tests failed for package ", package)
  }
  result
}









.ignore.tags <- function(lines, tags)  {
  for(tag in tags)  {
    regex <- paste(sep="", " ", tag, "=\".*?\"")
    lines <- gsub(regex, "", lines)
  }
  return(lines)
}

.concat <- function(lines)  paste(collapse="", lines)
  

##' Transformer for ignoring id, class, type and some whitespace
##'
##' This transformer strips all id, class and type tags, with one preceding space, from the SVG lines.
##'
##' It also ignores what it thinks is space between tags, namely >\\s+<
##' 
##' This is meant primary as an argument for \code{transformer} in \code{\link{check.same.svgs}}.
##'
##' Not exported---you should fully qualify it with \code{AnalysisPageServer:::ignore.lots.of.stuff} if you
##' want to use it.
##' 
##' All the lines will be concatenated, too, into a single character string.
##' 
##' @title ignore.lots.of.stuff
##' @param lines Character vector of lines from the SVG file.
##' @return Character vector. Same lines, with id and class tags transformed.
##' @seealso \code{\link{check.same.svgs}}
##' @author Brad Friedman
ignore.lots.of.stuff <- function(lines)  {
  one.line <- .concat(.ignore.tags(lines, c("id", "class", "type")))
  one.line <- gsub(">\\s+<", "><", one.line)
  return(one.line)
}

##' Test that 2 SVG files have the same content
##'
##' Test that 2 SVG files have the same content. Most differences in whitespace are ignored,
##' as are all "id", "class" and "type" tags.
##' @title check.same.svgs
##' @param got.lines Charvec of the lines of the SVG to test
##' @param exp.lines Charvec of the lines of the reference SVG
##' @param ... Passed through to \code{checkEquals} (such as test name).
##' @return As \code{\link[RUnit]{checkEquals}}
##' @author Brad Friedman
##' @export
check.same.svgs <- function(got.lines, exp.lines, ...)  {
  checkEquals(ignore.lots.of.stuff(got.lines),
              ignore.lots.of.stuff(exp.lines),
              ...)
}

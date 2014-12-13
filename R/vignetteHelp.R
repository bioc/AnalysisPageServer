##' Check availability of Rook and fork for vignettes
##'
##' Check availability of Rook and fork for vignettes. This function is only
##' meant to be called at the top of the ExampleServers.Rmd and InteractiveApps.Rmd
##' vignettes. It checks that the user has Rook >= 1.1 and fork installed.
##' If not, then it emits a useful message about how to install it, and that
##' the vignette will not build with all features. It also writes functions
##' \code{kill.process}, \code{readLines} (yes! be careful!),
##' \code{startRookAnalysisPageServer} and \code{new.rook.analysis.page.app}
##' in the Global namespace
##' to avoid calling the real functuons and instead just emit a short
##' message that Rook/fork are not available. The message is also available
##' in the global variable \code{no.rook.fork.msg}.
##'
##' Really, you shouldn't
##' use this function except if you are writing a new vignette.
##' @title checkRookForkForVignettes
##' @return TRUE if Rook (>= 1.1) and fork are available, otherwise FALSE.
##' @author Brad Friedman
##' @param rookforkOK Provide FALSE here if you want to simulate not
##' having valid installed copies of rook/fork, without actually having
##' to delete them. Normally you should not supply this argument
##' @note Are you sure you really want to use this function? Probably not,
##' unless you are calling it from the top of a new vignette. Otherwise
##' your are really asking for trouble messing up your global namespace.
##' See Details.
##' @note Why are you still here? Didn't I tell you not to call this function?
checkRookForkForVignettes <- function(rookforkOK)  {
  rookOK <- isTRUE(try(checkPackageVersion("Rook", 1.1), silent = TRUE))
  forkOK <- checkPackageInstalled("fork")
  if(missing(rookforkOK))
    rookforkOK <- rookOK && forkOK
  if(rookforkOK)  {
    cat("Rook >= 1.1 and fork are available, so this vignette should build properly")
  }  else  {
    no.rook.fork.msg <<- knitr::asis_output(toJSON("Rook >= 1.1 + fork not available"))
    for(fcn.name in c("kill.process", "readLines", "startRookAnalysisPageServer", "new.rook.analysis.page.app"))
      assign(fcn.name,
             function(...)  no.rook.fork.msg,
             envir = .GlobalEnv)
    
    cat(sep = "",
        "Rook >= 1.1 or fork is not available, so although you can still use the static reporting
features of AnalysisPageServer, and deploy dynamic servers with FastRWeb and RApache, you
will not be able to deploy using Rook/Rhttpd, or build this vignette properly. You'll see
the message ", no.rook.fork.msg, " at all the points in this vignette where
Rook+fork would have been required: starting the server, querying the server and stopping
the server. If you want you can install/update the missing dependencies like this:

  install.packages(\"fork\")
  install.packages(\"devtools\")
  library(devtools)
  install_github(\"Rook\", \"jeffreyhorner\")
")
  }
  return(rookforkOK)
}

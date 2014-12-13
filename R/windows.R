##' Predicate to test if running on a windows platform
##' @author Brad Friedman
##' @export
##' @return Boolean:  \code{TRUE} on windows, \code{FALSE} on other platforms
platformIsWindows <- function()  {
  .Platform$OS.type == "windows"
}

##' Throw an error if platform is windows
##' @param caller Name of calling function. Default: \code{as.character(sys.call(-1))[1]}
##' @param errMesg Error message to throw under windows. Default:
##' \code{paste0(caller, "() does not run under windows")}.
##' @param isWindows Boolean, indicating if current platform is windows.
##' Default: \code{platformIsWindows()}.
##' @return Nothing
dieIfWindows <- function(caller = as.character(sys.call(-1))[1],
                         errMesg = paste0(caller, "() does not run under windows"),
                         isWindows = platformIsWindows())  {
  isWindows && stop(errMesg)
  invisible()
}

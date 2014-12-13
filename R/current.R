
##' Return the currently running AnalysisPage app
##'
##' Return the currently running AnalysisPage app. The way this is done
##' is to first try to chase up the call stack and find the first environment which is
##' an \code{AnalysisPageRApacheApp}, and return that. If that fails
##' then it looks for \code{app} in the GlobalEnv and returns that. IF that
##' also fails then it reutrns NULL.
##' @return Current \code{AnalysisPageRApacheApp}, or NULL
##' if it can't be found.
##' @author Brad Friedman
##' @export
current.app <- function()  {

  envs <- lapply(sys.parents(), function(i.frame)  {
    ## -2 to skip lapply and function(i.frame) calls
    environment(sys.function(i.frame - 2))
  })
  app <- Find(function(x) is(x, "AnalysisPageRApacheApp"), envs)

  if(is.null(app) && exists("app", .GlobalEnv))
    app <- get("app", .GlobalEnv)
  
  return(app)
}


##' Retrieve an Analysis page from the current app
##'
##' If the current app (as returned by (\code{\link{current.app}})
##' has a page of the given name then it is returned. If
##' the current app can't be found, or if it does not have such a
##' page, then NULL is returned.
##' @param page String, name of desired page.
##' @return AnalysisPage, or NULl
##' @author Brad Friedman
##' @export
analysis.page.of.current.app <- function(page)  {
  app <- current.app()
  reg <- app$registry
  if(is(reg, "AnalysisPageRegistry"))  {
    ## (This branch should always be executed---you'd have to go far
    ## out of your way to build an app without a registry. I'm just
    ## trying to avoid throwing errors!
    if(has.page(reg, page))  {
      return(get.page(reg, page))
    }
  }
  return(NULL)
}

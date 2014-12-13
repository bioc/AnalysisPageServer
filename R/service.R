##' Build an AnalysisPage service
##' 
##' Convert a functions into an
##' AnalysisPage service. An AnalysisPage service is an AnalysisPage with the service flag set.
##' That means that pages() will not return it, so it will not be directly available through the
##' front end. The reason to do this would normally be so that it can be used to populate
##' a combobox or other part of the website. In practice it also means that the return
##' value will probably not use the AnalysisPageDataNode system---it is free to return
##' some arbitrary JSON string or other text.
##'
##' It is a wrapper for \code{\link[AnalysisPageServer]{new.analysis.page}}, and passes all of
##' its arguments through (but with different defaults now)
##' @title build.service
##' @param handler The handler function to convert
##' @param param.set AnalysisPageParamSet for the handler. Default: \code{default.service.paramset(handler)}
##' @param annotate.plot Default: FALSE
##' @param annotate.data.frame Default: FALSE
##' @param no.plot Default: TRUE
##' @param service Default: TRUE
##' @param skip.checks Default: TRUE. This is passed through to \code{\link{new.analysis.page}} and should
##' normally not be modified. (we don't check services because they are not required to provide default
##' arguments.)
##' @param ... Further arguments to pass to \code{\link{new.analysis.page}}
##' @return \code{AnalysisPage}
##' @author Brad Friedman
##' @seealso \code{\link[AnalysisPageServer]{new.analysis.page}}
##' @export
##' @examples
##' poem.file <- system.file("examples/in-a-station-of-the-metro.html", package="AnalysisPageServer")
##' poem.html <- readLines(poem.file, warn = FALSE)
##' poem <- build.service(function()  {
##'   new.response(paste0(poem.html, "\n"),
##'   content.type = "text/html")
##' }, name = "poem")
build.service <- function(handler,
                          param.set = default.service.paramset(handler),
                          annotate.plot = FALSE,
                          annotate.data.frame = FALSE,
                          no.plot = TRUE,
                          service = TRUE,
                          skip.checks = TRUE,  ## have to skip checks since defaults are not provided
                          ...)  {
  new.analysis.page(handler,
                    param.set=param.set,
                    annotate.plot=annotate.plot,
                    annotate.data.frame=annotate.data.frame,
                    no.plot=no.plot,
                    service=service,
                    skip.checks=skip.checks,
                    ...)
}





##' Create an AnalysisPageParamSet for a service handler
##'
##' The services are not required to supply default values since they don't have to be rendered as parameters.
##' AnalysisPageServer still wants to have a param set. It can be used, for example, to check arguments
##' when building URLs. So we
##' artifically provide default values of 0 for everything, so you get a bunch of simple params.
##' @title default.service.paramset
##' @param handler Handler function of service
##' @return AnalysisPageParamSet
##' @author Brad Friedman
default.service.paramset <- function(handler)  {
  plist <- lapply(names(formals(handler)), default.param, 0)
  
  param.set(plist)
}



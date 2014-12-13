##' Link into the app in a particular state
##'
##' It is possible to encode the application state into a URL which will then be executed
##' by the front end. There are 2 parts to the state, and each is supplied as one
##' argument to this function (which then becomes one URL-encoded parameter in the link)
##'
##' \describe{
##'   \item{"page"}{The name of the page within the app, such as "2way"}
##'   \item{"params"}{A subset of parameters and their values, already filled out}
##' }
##' @title app.link
##' @param page \code{AnalysisPage} object. The name will be extracted from this object and its AnalysisPageParamSet will be used to
##' validate the \code{params} argument. Or, you can provide a character string. Then you won't get the parameter value checking for
##' free but you will get the page name.
##' @param params Named list of parameter values. If \code{page} is an \code{AnalysisPage} then they will be validated using the
##' parameter set of that page.
##' @param submit If submit is true then turn on a flag that says that the analysis should be submitted. Otherwise the link will
##' open the primary parameter area. It is an error to supply params if submit = FALSE (this may be allowed in the future, but right
##' now it is not supported.). Default: TRUE
##' @param relative String. This string will be prepended to the relative URL beginning with "?". Default
##' is empty string, so you would get something like "#page/2way/...". If you gave, for example
##' "http://research.gene.com/expressionplot/app.html" then you would get "http://research.gene.com/expressionplot/app.html#page/2way/...".
##' In RApache context the Global variable SERVER$headers_in$Referer is very useful for this.
##' @return A relative URL beginning with "#", or a full URL if \code{relative} is provide
##' @author Brad Friedman
##' @export
##' @examples
##'   analysis.page.link("mypage", params=list(foo=1))
analysis.page.link <- function(page, params=list(), submit=TRUE, relative="")  {
  if(!submit)  {
    length(params) == 0 || stop("You supplied submit = FALSE (to go to primary parameter area instead of actually submitting/running the analysis) but also gave parameters. This is not (yet) supported")
  }

  
  if(is(page, "AnalysisPage"))  {
    ## transform.labeled means that if a combobox or select parameter has a scalar value then
    ## it is transformed into c(v=value, r=readable.value), which is what the front end is expected
    ## combobox and select are so-called "labeled" parameters because they have a user-visible label
    ## (readable) that possibly differs from the actual param value (real)).
    params <- validate.param.list(page$params, params,
                                  transform.labeled=TRUE)
    page.name <- page$name
  }  else  {
    page.name <- page
  }

  stopifnot(is.character(page.name) && length(page.name) == 1)

  path <- if(submit)  {
    stopifnot(length(params) == 0 || !is.null(names(params)))

    param.str <- urlEncode(toJSON(params))
    
    
    paste(sep = "/",
          "page",
          page.name,
          "analysis",
          param.str)
  }  else  {
    paste(sep = "/",
          "page",
          page.name,
          "primary")
  }
          

  return(paste(sep="", relative, "#", path))
}






##' Build a URL to run an analysis on the server
##'
##' Unlike \code{\link{analysis.page.link}} this is not a URL to open in the web browser, but rather the kind of URL used internally by the
##' front end for its AJAX request to the server to perform an analysis, or retrieve the analyses as web services.
##' @title analysis.link
##' @param page Name of page
##' @param params List of parameter values (as R objects---this function will encode them). Default: \code{list()} (no parameters).
##' @param app.base.url Base URL for application. This is usually the prefix in which the app landing HTML page is found.
##' @param width Width parameter for graphics devices. Normally this is in inches, although it depends on exactly
##' how you set up your application. Default: 9. Ignored if \code{include.plot.params = FALSE}
##' @param height Height parameter for graphics devices. Normally this is in inches, although it depends on exactly
##' how you set up your application. Default: 7. Ignored if \code{include.plot.params = FALSE}
##' @param device Device to use for plotting. Default: "svg". (This is going to be sent to the server, not run
##' in the same process as this function. It would be ignored if the page was built with \code{no.plot = TRUE}.)
##' Ignored if \code{include.plot.params = FALSE}
##' @param include.plot.params Boolean, default TRUE. If TRUE then include the width, height, device and
##' textarea_wrap parameters in the URL.
##' in the URL. Otherwise omit them.
##' @return URL
##' @author Brad Friedman
##' @export
analysis.link <- function(page,
                          params = list(),
                          app.base.url,
                          width = 9,
                          height = 7,
                          device = "svg",
                          include.plot.params = TRUE)  {

  
  json.params <- c(list(page=page),
                   params)
  if(include.plot.params)  {
    json.params$textarea_wrap <- FALSE
    json.params$width <- width
    json.params$height <- height
  }

  all.params <- lapply(json.params, toJSON)
  if(include.plot.params)
    all.params$device <- device

  query <- paste(sep="=",
                 aps.urlEncode(names(all.params)), aps.urlEncode(all.params),
                 collapse="&")
  url <- paste(sep="", app.base.url, "/R/analysis?", query)

  return(url)
}





##' Build a URL to call a AnalysisPageServer webservice
##'
##' This function is simply a specialization of \code{analysis.link} with a few conveniences
##' for webservice-type pages. In particular, the parameters of that function about plotting
##' are not available.
##' @param page Name of page
##' @param params List of parameter values (as R objects---this function will encode them). Default: \code{list()} (no parameters).
##' @param app.base.url Base URL for application. This is usually the prefix in which the app landing HTML page is found.
##' @return URL
##' @author Brad Friedman
##' @export
service.link <- function(page,
                         params = list(),
                         app.base.url)  {

  url <- analysis.link(page,
                       params = params,
                       app.base.url = app.base.url,
                       include.plot.params = FALSE)

  return(url)
}


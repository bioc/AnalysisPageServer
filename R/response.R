##' Build a new AnalysisPageResponse object
##'
##' A handler may return an AnalysisPageResponse object, which is basically a complete
##' response, if it doesn't want the framework to do any extra processing. This allows
##' complete control over the response.
##' @title new.response
##' @param body Either a raw vector or a character vector that constitutes the response body.
##' @param content.type A string giving the content-type, such as "text/plain"
##' @param status Integer. An HTTP response status. Default, 200, means HTTP_OK
##' @param headers Named charvec of extra HTTP headers. Default: \code{character()}  (none)
##' @return AnalysisPageResponse object
##' @author Brad Friedman
##' @export
##' @examples
##' poem.file <- system.file("examples/in-a-station-of-the-metro.html", package="AnalysisPageServer")
##' poem.html <- readLines(poem.file, warn = FALSE)
##' new.response(paste0(poem.html, "\n"), content.type = "text/html")
new.response <- function(body, content.type, status=200, headers = character())  {
  response <- list(body = body,
                   content.type = content.type,
                   status = status,
                   headers = headers)
  class(response) <- "AnalysisPageResponse"

  return(response)
}

.is.character.or.raw <- function(obj)  is.character(obj) || is.raw(obj)

.validate.response <- function(response, prefix="")  {
  .validate.type(response, "AnalysisPageResponse", prefix)
  .validate.list.with.names(response, c("body", "content.type", "status", "headers"), paste(prefix, "response: "))

  .validate.type(response$body, .is.character.or.raw, paste(prefix, "response$body: "))
  .validate.string(response$content.type, paste(prefix, "response$content.type: "))
  .validate.atomic(response$status, paste(prefix, "response$status: "))
  .validate.length(response$status, 1, paste(prefix, "response$status: "))  
}

##' Build Javascript configuration
##'
##' Build Javascript configuration. This function returns Javascript which can be used as the config.js file for
##' the front-end client.
##'
##' The only reason to call this directly would be to set up specialized deployments.
##' @title config.js
##' @param app.prefix Prefix for the path to your application. This will be used as the value for the "history.root"
##' parameter in the Javascript file, and also to build the default \code{client.r.url}.
##' @param client.r.url Location of R resources. Default: \code{file.path(app.prefix, "R")}.
##' @param client.rest.url Location of Sloth REST resources. Default: \code{""}. This is a poorly documented feature
##' that most people should ignore.
##' @param template.file Path to template file for config.js. Default is taken from "inst" directory of AnalysisPageServer package.
##' @param static Boolean, default FALSE. Controls the default values for \code{parameter.collection.url}
##' and \code{page.collection.url}.
##' @param parameter.collection.url Default: If \code{static = TRUE} then "" else "params"
##' @param page.collection.url Default: If \code{static = TRUE} then "" else "pages"
##' @return Charvec of Javascript
##' @author Brad Friedman
##' @export
config.js <- function(app.prefix = "/custom/RAPS",
                      client.r.url = file.path(app.prefix, "R"),
                      client.rest.url = "",
                      template.file = system.file("config-template.js", package = "AnalysisPageServer"),
                      static = FALSE,
                      parameter.collection.url = if(static) "" else "params",
                      page.collection.url = if(static) "" else "pages")  {
  lines <- readLines(template.file)

  ## add a slahs to the end if it doesn't end with one
  ## But leave empty string alone
  add.slash <- function(url)  {
    n <- nchar(url)
    if(n > 0 && substr(url, n, n) != "/")  {
      return(paste(sep = "", url, "/"))
    }  else  {
      return(url)
    }
  }
  
  subs <- c("___CLIENT_R_URL___" = add.slash(client.r.url),
            "___CLIENT_REST_URL___" = add.slash(client.rest.url),
            "___HISTORY_ROOT___" = add.slash(app.prefix),
            "___PARAMETER_COLLECTION_URL___" = parameter.collection.url,
            "___PAGE_COLLECTION_URL___" = page.collection.url)
  
  for(param in names(subs))
    lines <- sub(param, subs[[param]], lines)

  return(lines)
}

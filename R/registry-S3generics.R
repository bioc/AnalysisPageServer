##' Predicate to test if some page is already registered under a name
##'
##' Predicate to test if some page is already registered under a name
##' @title has.page
##' @param registry Registry
##' @param page.name An AnalysisPageRegistry
##' @return Logical, indicating if a page is already registered under than name
##' @author Brad Friedman
##' @examples
##' example(register.page, ask=FALSE)  # register the sine page
##' has.page(registry, "sine")         # should return TRUE now.
##' @export
##' @seealso \code{\link{new.registry}}, \code{\link{register.page}}, \code{\link{get.page}}, \code{\link{pages}}
has.page <- function(registry, page.name)  UseMethod("has.page")

##' Return a registered function
##'
##' Return a registered function
##' @title get.page
##' @param registry AnalysisPageRegistry object
##' @param page.name Name of the registered function 
##' @return The registered function. Stops if no such function is registerd
##' @author Brad Friedman
##' @examples
##' example(register.page, ask=FALSE)  # register the sine page
##' get.page(registry, "sine")         # should return the sine.handler function
##' @export
##' @seealso \code{\link{new.registry}}, \code{\link{register.page}}, \code{\link{has.page}}, \code{\link{pages}}
get.page <- function(registry, page.name)  UseMethod("get.page")

##' Get names of all pages in registry
##'
##' Get names of all pages in registry
##' @title pages
##' @param registry AnalysisPageRegistry object
##' @param include.services Logical. Should I include services in my list of all pages? Default: FALSE, do not include services.
##' @return Character vector of names of pages in registry
##' @author Brad Friedman
##' @note
##' Service pages are identified as those having their \code{service} flag set, which is done at page build time using
##' the \code{service} parameter of the \code{new.analysis.page} constructor.
##' @export
##' @examples
##' empty.pages <- pages(new.registry())   # should be empty character vector
##' example(register.page, ask=FALSE)      # see register.page example---registers the sine handler
##' pages(registry)                        # should now be the character vector "sine"
##' @seealso \code{\link{new.registry}}, \code{\link{register.page}}, \code{\link{has.page}}, \code{\link{get.page}}
pages <- function(registry, include.services=FALSE)  UseMethod("pages")
            

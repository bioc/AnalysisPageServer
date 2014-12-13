
##' Make a new (empty) registry.
##'
##' @title new.registry
##' @return A new registry, which is just an empty list with class AnalysisPageRegistry.
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{register.page}}, \code{\link{has.page}}, \code{\link{get.page}}, \code{\link{pages}}
##' @param ... \code{AnalysisPage}s with which to initially populate the registry
##' @examples
##' r <- new.registry()
new.registry <- function(...)  {
  reg <- list(...)
  if(length(reg) > 0)  for(i in 1:length(reg))
    is(reg[[i]], "AnalysisPage") || stop("Argument ", i, " is Not an AnalysisPage: ", paste(collapse=" ", is(reg[[i]])))

  names(reg) <- sapply(reg, "[[", "name")
  class(reg) <- "AnalysisPageRegistry"
  
  return(reg)
}

##' Test if an argument is an AnalysisPageRegistry
##'
##' @title is.registry
##' @param registry A candidate object
##' @return Logical, indicating that the object is an "AnalysisPageRegistry"
is.registry <- function(registry)  is(registry, "AnalysisPageRegistry")

.is.registry.or.stop <- function(registry) {
  is.registry(registry) || stop("Argument is not an AnalysisPageRegistry: ", paste(collapse=" ", is(registry)))
}


##' @export
##' @rdname has.page
has.page.AnalysisPageRegistry <- function(registry, page.name)  {
  .is.registry.or.stop(registry)
  !is.null(registry[[page.name]])
}
         
##' Register a page
##'
##' Register a page
##' @title register.page
##' @param registry AnalysisPageRegistry object
##' @param page.name Character. Name of the page to register
##' @param page AnalysisPage or function. If a function is supplied instead of an
##' AnalysisPage object then
##' it will be coerced into an AnalysisPage object calling \code{\link{new.analysis.page}}.
##' @param overwrite Logical. If FALSE (default) then throw and error if a page is
##' already registered under that name. If TRUE then just warn.
##' @return void
##' @examples
##' # Make a new registry
##' registry <- new.registry()
##' 
##' # Now register it under the name "sine" (in the "example" registry)
##' # and keep the modified registry.
##' registry <- register.page(registry, "sine", AnalysisPageServer:::sine.handler)
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{new.registry}}, \code{\link{has.page}}, \code{\link{get.page}}, \code{\link{pages}}, \code{\link{new.analysis.page}}
register.page <- function(registry, page.name, page, overwrite=FALSE)  {
  if(is.function(page))  page <- new.analysis.page(page, name=page.name)
    
  is(page, "AnalysisPage") || stop("page must be an AnalysisPage or a function: ", paste(collapse=" ", is(page)))

  .is.registry.or.stop(registry)

  if(has.page(registry, page.name))  {
    mesg <- paste(sep="", page.name, " is already registered in registry '", registry ,"' ")
    if(overwrite)  {
      warning(mesg, " Overwriting.\n")
    }  else  {
      stop(mesg, "and overwrite is not set")
    }
  }

  registry[[page.name]] <- page
  
  return(registry)
}



##' @export
##' @rdname get.page
get.page.AnalysisPageRegistry <- function(registry, page.name)  {
  .is.registry.or.stop(registry)
  missing(page.name) && stop("page.name is required")
  has.page(registry, page.name) || stop(sprintf("No such page '%s' in registry", page.name))
  registry[[page.name]]
}



##' @export
##' @rdname pages
pages.AnalysisPageRegistry <- function(registry, include.services=FALSE)  {
  .is.registry.or.stop(registry)
  if(include.services)  {
    return(names(registry))
  }  else  {
    is.service <- sapply(registry, "[[", "service")

    ## handle degenerate case of no pages and return zero-length charvec. (Otherwise the next line would return NULL)
    if(length(is.service) == 0) return(character())
    return(names(which(!is.service)))
  }
}


## This checks that your registry is valid or dies.
.validate.registry <- function(registry)  {
  .is.registry.or.stop(registry)
  
  for(p in pages(registry))
    .validate.analysis.page(get.page(registry, p))

  param.set.list <- lapply(pages(registry), function(p)  get.page(registry, p)$params)
                           
  .validate.persistent.params(param.set.list)
}

##' Build a toy registry for examples and testing
##'
##' The toy registry has a sine and a cosine page and the scattergram page.
##' @title trig.registry
##' @return AnalysisPageRegistry
##' @author Brad Friedman
##' @export
##' @examples
##' tr <- trig.registry()
##' pages(tr)
trig.registry <- function()  {
  registry <- register.page(new.registry(), "sine",
                            sine.handler)  
  registry <- register.page(registry, "cosine",
                            cosine.handler)
  registry <- register.page(registry, "dataonly",
                            dataonly.analysis.page())
  registry <- register.page(registry, "dataframeonly",
                            dataframeonly.analysis.page())
  return(registry)
}

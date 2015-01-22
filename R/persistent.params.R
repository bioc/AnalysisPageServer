

##' Return persistent parameter dependencies for an object
##'
##' Return persistent parameters dependencies for an object.
##'
##' This is a named list. The names are the names of persistent
##' parameters, and the values are the other persistent parameters
##' on which they depend.
##' @param x An object for which there is a \code{persistent.param.dependencies} method.
##' @return Named list of charvecs, see Details.
##' @author Brad Friedman
##' @export
persistent.param.dependencies <- function(x)  {
  UseMethod("persistent.param.dependencies")
}



## Note: the next blank ##' line is important since it
## makes the next paragraph part of the Details rather than
## part of the man page title.
##'
##' For an \code{AnalysisPageParam} the return value is either
##' a charvec of the object's
##' persistent dependencies. It is important to note that
##' The namespace for persistent dependencies
##' of an \code{AnalysisPageParam} is the same as the namespace
##' of the page Parameters. This is because when calling a constructor
##' for an \code{AnalysisPageParam} at most we might specify the
##' names of other Parameters (for example for combobox dependencies).
##' But the other Parameters are not available at that time, so
##' we can't look up their corresponding names in the persistent
##' namespace.
##' @export
##' @rdname persistent.param.dependencies
persistent.param.dependencies.AnalysisPageParam <- function(x)  {
  pp <- x$persistent
  if(is.null(pp))  {
    return(character(0))
  }  else  {
    ppdVec <- as.character(x$persistent_dependencies)
    return(ppdVec)
  }
}



##'
##' For an \code{AnalysisPageParamSet} or an
##' \code{AnalysisPage}, the return value is a list
##' named after all of the persistent params, the values being
##' charvecs of their dependencies. Note that
##' The namespace for persistent dependencies
##' of an \code{AnalysisPageParamSet} is the persistent namespace,
##' not the Page Parameter namespace.
##' @export
##' @rdname persistent.param.dependencies
persistent.param.dependencies.AnalysisPageParamSet <- function(x)  {
  persNameLookup <- lapply(x, "[[", "persistent")
  persNameLookup <- Filter(Negate(is.null), persNameLookup)

  if(length(persNameLookup) == 0)
    return(list())
  
  ## Vector of Page Parameter Names of all persistent parameters on the page
  persParPageNames <- names(persNameLookup)

  ## persistent parameter dependencies structures:
  ## Named list from Page Parameter Name to charvec of Page Parameter Names
  ppd.pageParNames <- lapply(x[persParPageNames], persistent.param.dependencies)



  ## setNames(persParPageNames, persNameLookup)
  ## is the reverse lookup of persNameLookup. The ppn argument
  ## will be the names of the persistent parameters in the Page namespace,
  ## but the final list will have the corresponding names from the Persistent
  ## namespace
  ppd.persParNames <- lapply(setNames(persParPageNames, persNameLookup),
                             function(ppn)  {
                               ## dependent pars Page Names
                               dp.pageNames <- ppd.pageParNames[[ppn]]
                               nonPersistent <- setdiff(dp.pageNames, persParPageNames)
                               length(nonPersistent) == 0 || stop("Persistent Parameter '", ppn, "' is dependent on non-persistent parameter(s): ",
                                        paste(collapse = " ", nonPersistent))
                               ## as.character handles the length 0 case correctly
                               ## (gives me character(0) instead of NULL)
                               as.character(unlist(persNameLookup[dp.pageNames]))
                             })

  return(ppd.persParNames)
}


##' @export
##' @rdname persistent.param.dependencies
persistent.param.dependencies.AnalysisPage <- function(x)  {
  persistent.param.dependencies(x$params)
}

##'
##' For an \code{AnalysisPageRegistry}
##' the return value is a list
##' named after all of the persistent params of any of the pages,
##' the values being
##' charvecs of their dependencies. If there is an discrepancy in
##' the dependencies for a given persistent param, then the union of
##' all dependencies is taken. (This will be checked for acyclicity
##' by \code{.validate.registry}.)
##' The namespace for persistent dependencies
##' of an \code{AnalysisPageRegistry} is the persistent namespace,
##' not the Page Parameter namespace.
##' @export
##' @rdname persistent.param.dependencies
persistent.param.dependencies.AnalysisPageRegistry <- function(x)  {

  ppds <- lapply(pages(x), function(pn)  {
    Page <- get.page(x, pn)
    persistent.param.dependencies(Page)
  })

  names(ppNames) <- ppNames <- unique(unlist(lapply(ppds, names)))

  ppd <- lapply(ppNames, function(ppn)  {
    unique(unlist(lapply(ppds, "[[", ppn)))
  })

  return(ppd)
}




##' Return names of persistent parameters for an object
##'
##' Return names of persistent parameters for an object. The exact
##' meaning depends on the type of object. For an AnalysisPage it would
##' be the persistent params for that page. For an AnalysisPageRegistry
##' it would be the persistent params for any of its pages.
##'
##' Note that the names are from the shared namespace, which are
##' the values passed as the \code{persistent} argument to the
##' \code{AnalysisPageParam} constructor functions such as \code{\link{simple.param}}.
##' Although this is usually the same as actual names of the \code{AnalysisPageParam}s themselves
##' there is no requirement that they be the same.
##' @param x An object for which there is a \code{persistent.params} method.
##' @return Charvec of persistent params
##' @author Brad Friedman
##' @export
persistent.params <- function(x)  {
  UseMethod("persistent.params")
}

##' @export
##' @rdname persistent.params
persistent.params.AnalysisPageParam <- function(x)  {
  pp <- x$persistent
  if(is.null(pp)) character(0)  else  pp
}

##' @export
##' @rdname persistent.params
persistent.params.AnalysisPageParamSet <- function(x)  {
  pp <- unique(unlist(lapply(x, persistent.params)))
  if(is.null(pp)) character(0)  else  pp
}


##' @export
##' @rdname persistent.params
persistent.params.AnalysisPage <- function(x)  {
  persistent.params(x$params)
}


##' @export
##' @rdname persistent.params
persistent.params.AnalysisPageRegistry <- function(x)  {
  analysis.pages <- lapply(pages(x), function(page) get.page(x, page))
  pp <- unique(unlist(lapply(analysis.pages, persistent.params)))
  if(is.null(pp)) character(0)  else  pp
}


.assert.persistent.param.dependencies.are.persistent <- function(registry)  {
  ppdeps <- persistent.param.dependencies(registry)
  pp <- persistent.params(registry)
  not.persistent <- setdiff(unlist(ppdeps), pp)
  length(not.persistent) == 0 || stop("Non-persistent params in persistent.param.dependencies: ", paste(collapse = " ", not.persistent))
}


.assert.persistent.param.dependencies.are.acyclic <- function(dependencies)  {
  .graphIsAcyclic(dependencies) || stop("persistent dependencies have a cycle")
}

.validate.persistent.param.dependencies <- function(registry)  {
  ppdeps <- persistent.param.dependencies(registry)
  .assert.persistent.param.dependencies.are.acyclic(ppdeps)
  .assert.persistent.param.dependencies.are.persistent(registry)
}


##' @importClassesFrom graph graphNEL
.graphIsAcyclic <- function(edgeL)  {
  if(is.list(edgeL))  {
    nodeL <- unique(c(names(edgeL), unlist(edgeL)))
    if(length(nodeL) == 0)
      nodeL <- character(0)
    g <- new("graphNEL", nodes = nodeL,  edgeL = edgeL, edgemode = "directed")
  }  else if (is(edgeL, "graph"))  {
    g <- edgeL
  }  else  {
    stop("edgeL must be an edge list or a graph")
  }

  accL <- graph::acc(g, graph::nodes(g))

  for(n in names(accL))  {
    accFromN <- names(accL[[n]])
    if(n %in% unlist(lapply(accL[accFromN], names)))
      return(FALSE)  ## cycle found
  }
  return(TRUE)
}





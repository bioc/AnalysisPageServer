
##' Build a new AnalysisPageParamSet from a list of AnalysisPageParam's.
##'
##' Build a new AnalysisPageParamSet from a list of AnalysisPageParam's: Check for non-AnalysisPageParam elements
##' and for duplicate names. Apply $name elements to names of param set. Set class to AnalysisPageParamSet
##' @title param.set
##' @param ... AnalysisPageParam objects. Or a single argument, being a list of AnalysisPageParam objects.
##' @return AnalysisPageParamSet
##' @author Brad Friedman
##' @export
##' @examples
##' par1 <- simple.param(name = "par1")
##' par2 <- bool.param(name = "par2")
##' pset <- param.set(par1, par2)
param.set <- function(...)  {
  param.list <- list(...)
  if(length(param.list) == 1 &&
     !is(param.list[[1]], "AnalysisPageParam"))  param.list <- param.list[[1]]
  
  is.list(param.list) || stop("param.list must be a list")
  all(sapply(param.list, is, "AnalysisPageParam")) || stop("param.list must contain only AnalysisPageParams")
  parnames <- sapply(param.list, "[[", "name")
  if(length(parnames) > 0)  {
    dup.parnames <- names(which(table(parnames)>1))
    length(dup.parnames) == 0 || stop("Duplicate parameter names not permitted in the same request: ", paste(collapse=" ", dup.parnames))
    names(param.list) <- parnames
  }

  class(param.list) <- "AnalysisPageParamSet"
  return(param.list)
}


##' Build a default AnalysisPageParam for one argument
##'
##' You provide the name of the argument and default and I build an AnalysisPageParam.
##' The magic here is as follows:
##' \enumerate{
##'   \item{Named lists become \code{compound.param}, with \code{default.param()} then called recursively.}
##'   \item{Unnamed lists of become \code{array.param}, with \code{default.param()} called
##'         on the first element of the list to build the prototype. The length of the list
##'         is taken as the start value. min/max default to 0/Inf. (Advanced Note: the name is copied to the sub-element)}
##'   \item{Vectors of length > 1 become \code{select.param}s}
##'   \item{Vectors of length 0 or 1 and NULLs become \code{simple.param}s}
##' }
##' On any other type of argument it throws an error.
##' @title default.param
##' @param name Name of the parameter
##' @param prototype Default value on which the parameter should be built.
##' @param ... Further arguments passed to the constructor for the appropriate parameter type. For example,
##' you can include \code{label}, \code{description}, \code{advanced} and \code{show.if}.
##' @return AnalysisPageParam
##' @author Brad Friedman
##' @export
##' @examples
##' default.param(name = "word", prototype = c("foo", "bar", "baz"), label = "Choose a word")
default.param <- function(name, prototype, ...)  {
  if(is.list(prototype))  {
    pns <- names(prototype)
    if(is.null(pns))  {
      ## unnamed list --- array.param
      return(
             array.param(name=name,
                         prototype=default.param(name, prototype[[1]]),
                         start = length(prototype),
                         ...)
             )
    }  else  {
      ## named list --- compound.param
      children <- param.set(lapply(pns, function(pn) default.param(pn, prototype[[pn]])))
      return(compound.param(name=name,
                            children = children,
                            ...))
    }
  }  else if (is.vector(prototype) || is.null(prototype))  {
    if(length(prototype) > 1)  {
      ## select element
      return(select.param(name=name,
                          choices=prototype,
                          ...))
    }  else  {
      return(simple.param(name=name,
                          value=prototype,
                          ...))
    }
  }

  stop("Don't know how to build default.param for prototype which is ", paste(sep=" ", is(prototype)))
}


##' Build a basic ParamSet for your handler
##'
##' Each argument to your handler is rendered into a simple AnalysisPageParam with the name of the argument
##' and type "text". The idea is that you will then modify it as necessary to get more complicated widgets.
##' @title default.param.set
##' @param handler A function. (Typically one you are using as an AnalysisPage handler)
##' @return AnalysisPageParamSet
##' @examples
##'   f <- function(A=1, B=2) {}
##'   # param set with 2 form elements rendered as text inputs; something like   A [__________]     B [__________]
##'   pset <- default.param.set(f)
##' @author Brad Friedman
##' @export
default.param.set <- function(handler)  {
  names(parnames) <- parnames <- names(formals(handler))
  plist <- lapply(parnames, function(pn) default.param(pn, eval(formals(handler)[[pn]])))
  return(param.set(plist))
}



## iterate through data structure, removing any $transformer elements
## which are children of AnalysisPageParams.
.stripTransformer <- function(ap)  {
  ap$transformer <- NULL
  if(ap$type == "array")  {
    ap$prototype <- .stripTransformer(ap$prototype)
  }  else if(ap$type == "compound")  {
    for(child in names(ap$children))
      ap$children[[child]] <- .stripTransformer(ap$children[[child]])
  }
  return(ap)
}

##' Convert an AnalysisPageParamSet to a JSON string
##'
##' This is almost just calling toJSON but it knows to first remove $transformer
##' components, since functions can't be JSON encoded, and anyway that
##' is really server-side information.
##' @param ps AnalysisPageParamSet
##' @return JSON string
##' @author Brad Friedman
##' @export
##' @importFrom rjson toJSON
paramSetToJSON <- function(ps)  {
  toJSON(lapply(ps, .stripTransformer))
}

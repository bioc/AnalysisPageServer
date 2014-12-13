##' Validate a list of parameter values for an AnalysisPageParamSet
##'
##' Validate a list of parameter values for an AnalysisPageParamSet.
##' @title validate.param.list
##' @param pset AnalysisPageParamSet
##' @param plist List of parameter values for a subset of the parameters.
##' @param transform.labeled If TRUE, then labeled parameters (combobox
##' and select) will be transformed as necessary so that they have the
##' \code{list(v=value, r=readable.value)} format.>
##' If FALSE (default), then they will be left as-is.
##' @return Copy of \code{plist}, possibly transformed.
##' @author Brad Friedman
validate.param.list <- function(pset, plist, transform.labeled=FALSE)  {
  .validate.type(pset, "AnalysisPageParamSet")
  .validate.type(plist, is.list)

  extra.names <- setdiff(names(plist), names(pset))
  length(extra.names) == 0 || stop("Unknown parameters: ", paste(collapse=" ", extra.names))

  repeated.names <- names(which(table(names(plist)) > 1))
  length(repeated.names) == 0 || stop("Repeated parameters: ", paste(collapse=" ", repeated.names))

  param.names <- intersect(names(pset), names(plist))
  names(param.names) <- param.names
  plist <- lapply(param.names, function(pn)  {
    validate.param.value(pset[[pn]],
                         plist[[pn]],
                         transform.labeled=transform.labeled)
  })

  return(plist)
}

##' Validate a parameter value for an AnalysisPageParam
##'
##' This function dispatches to the type-specific validator.
##'
##' \code{transform.labeled} is passed on only if that validator accepts
##' such an argument. This should be just combobox and select types,
##' and indicates that the parameter value should be transformed to have the
##' \code{list(v=value, r=readable.value)} format.
##' @title validate.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @param transform.labeled Logical. Should the parameter value be transformed
##' if necessary to have the \code{list(v=value, r=readable.value)}
##' format?
##' @return The candidate value, possibly transformed. Throws error if the value is invalid.
##' @author Brad Friedman
##' @export
##' @examples
##' sp <- simple.param("foo")
##' validate.param.value(sp, 3)
validate.param.value <- function(app, val, transform.labeled=FALSE)  {

  type <- app$type
  validator.name <- paste(sep=".", "validate", type, "param.value")
  exists(validator.name) || stop(validator.name, " does not exist")
  validator <- get(validator.name)
  arglist <- list(app = app,
                  val = val)
  
  ## pass transform.labeled on if the validator function accepts such as argument.
  if("transform.labeled" %in% names(formals(validator)))
    arglist <- c(arglist, list(transform.labeled=transform.labeled))
  
  do.call(validator, arglist)
}


##' Validate a text-type AnalysisPageParam value
##'
##' Validate a text-type AnalysisPageParam value:
##' \enumerate{
##'   \item \code{val} must be a scalar (length-1 atomic)
##'   \item \code{val} must be unnamed
##' }
##' @title validate.text.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @return \code{val} unmodified
##' @author Brad Friedman
validate.text.param.value <- function(app, val)  {
  prefix <- paste(sep="", "text param ", app$name, ": ")
  .validate.scalar(val, prefix)
  .validate.unnamed(val, prefix)
  return(val)
}


##' Validate a file-type AnalysisPageParam value
##'
##' Validate a file-type AnalysisPageParam value:
##'
##' Current all values are invalid and result in an error being thrown.
##' The reason for this is that the use case I have in mind is to check
##' values when constructing a URL, and I don't think file-uploads will
##' be allowed to be URL-encoded. So I can't think what values will be
##' valid. Once I have another use case where they ought be valid then
##' I will know what form they should take.
##' @title validate.file.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @return Never returns
##' @author Brad Friedman
validate.file.param.value <- function(app, val)  {
  stop("file param ", app$name,": file type parameters cannot yet be validated.")
}


##' Validate a labeled AnalysisPageParam value
##'
##' Validate a labeled AnalysisPageParam value. Currently the labeled
##' param types are "combobox" and "select".
##'
##' Unnamed scalars are OK and named scalars are also OK.
##'
##' If the scalar is unnamed then its own name will be applied: \code{names(val) <- val}.
##' 
##' If \code{transform.labeled} is set then instead of returning
##' the candidate value as-is, it is transformed into
##' \code{list(v=real.value, r=readable.value)}.
##'
##' If \code{$allow.multiple == TRUE} then \code{length(val) > 1} is OK.
##' The encoding is simply \code{list(v=real.values, r=readable.values)},
##' where \code{real.values} and \code{readable.values} are equal-length vectors.
##' @title validate.labeled.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @param transform.labeled Logical. See details.
##' @return Candidate value, possibly transformed into list.
##' @author Brad Friedman
validate.labeled.param.value <- function(app, val, transform.labeled=FALSE)  {
  prefix <- paste(sep="", app$type, " param ", app$name, ": ")
  length(val) == 0 && stop(prefix, ": length=0")

  if(isTRUE(app$allow_multiple))  {
    .validate.atomic(val, prefix = prefix)
  }  else  {
    ## Value should be a scalar (that means "atomic of length 1"). 
    .validate.scalar(val, prefix=prefix)
  }

  ## If it has name(s) then
  ## that is taken to be the real value(s) with the value(s) being the readable value(s). Otherwise
  ## the two are identified.
  if(is.null(names(val)))  names(val) <- val
  
  if(transform.labeled)  {
    ## v = read [v]alue
    ## r = [r]eadable value.
    ## See https://sites.google.com/a/gene.com/expressionplot-dev/permalink
    tval <- list(v=names(val), r=unname(val))  ## tval: transformed value
    return(tval)
  }  else  {
    return(val)
  }
}


##' Validate a select-type AnalysisPageParam value
##'
##' Validate a select-type AnalysisPageParam value.
##'
##' \enumerate{
##'   \item The value must be a real value among the choices.
##'   \item The value must validate by \code{validate.labeled.param.value}
##' }
##' 
##' If \code{transform.labeled} is set then instead of returning
##' the candidate value as-is, it is transformed into
##' \code{list(v=real.value, r=readable.value)}.
##' @title validate.select.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @param transform.labeled Logical. See details.
##' @return Candidate value, possibly transformed into list.
##' @author Brad Friedman
validate.select.param.value <- function(app, val, transform.labeled=FALSE)  {
  real.val <- if(is.null(names(val)))  val  else names(val)
  real.val %in% names(app$choices) || stop("value '", real.val, "' is not among choices: ", paste(collapse=" ", names(app$choices)))

  tval <- validate.labeled.param.value(app, val, transform.labeled=transform.labeled)

  return(tval)
}


##' Validate a combobox-type AnalysisPageParam value
##'
##' Alias for \code{\link{validate.labeled.param.value}}
##' @inheritParams validate.labeled.param.value
##' @return Candidate value, possibly transformed into list.
validate.combobox.param.value <- validate.labeled.param.value


##' Validate a boolean-type AnalysisPageParam value
##'
##' Validate a boolean-type AnalysisPageParam value:
##' \enumerate{
##'   \item \code{val} must be length 1
##'   \item \code{val} must be a logical
##' }
##' @title validate.bool.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @return \code{val} unmodified
##' @author Brad Friedman
validate.bool.param.value <- function(app, val)  {
  prefix <- paste(sep="", "text param ", app$name, ": ")
  .validate.type(val, "logical", prefix)
  .validate.length(val, 1, prefix)
  return(val)
}


##' Validate a compound-type AnalysisPageParam value
##'
##' Validate a compound-type AnalysisPageParam value:
##' \enumerate{
##'   \item \code{val} must be a list. If length 0 then it is valid with no further checks.
##'   \item \code{names(val)} must not have any duplicates.
##'   \item \code{names(val)} must be a subset of \code{names(app$children)}.
##'   \item Each of the values in the list must be validated by the corresponding
##'         child. \code{transform.labeled} is passed on.
##' }
##' @title validate.compound.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @param transform.labeled Passed through to \code{\link{validate.param.value}} of children. Default: FALSE.
##' @return value, possibly with labeled children transformed
##' @author Brad Friedman
validate.compound.param.value <- function(app, val, transform.labeled=FALSE)  {
  prefix <- paste(sep="", "compound param ", app$name, ": ")
  .validate.type(val, type = is.list, prefix=prefix)
  if(length(val) == 0)  {
    return(val)
  }

  .validate.named(val, prefix=prefix)

  dup.names <- names(which(table(names(val)) > 1))
  length(dup.names) == 0 || stop(prefix, ": duplicate names: ", paste(collapse=" ", dup.names))

  unknown.names <- setdiff(names(val), names(app$children))
  length(unknown.names) == 0 || stop(prefix, ": unknown parameter name(s): ", paste(collapse=" ", unknown.names))

  parnames <- setNames(names(val), names(val))

  ## validate children, and possibly transform.
  tval <- lapply(parnames, function(parname) validate.param.value(app$children[[parname]], val[[parname]], transform.labeled=transform.labeled))

  return(tval)
}



##' Validate an array-type AnalysisPageParam value
##'
##' Validate an array-type AnalysisPageParam value:
##' \enumerate{
##'   \item \code{val} must be a list.
##'   \item \code{length(val)} must be in the acceptable range (between \code{app$min} and \code{app$max} inclusive).
##'   \item Each element of \code{val} must be validate by \code{app$prototype}.
##'         \code{transform.labeled} is passed on.
##' }
##' @title validate.compound.param.value
##' @param app AnalysisPageParam
##' @param val Candidate value
##' @param transform.labeled Passed through to \code{\link{validate.param.value}}. Default: \code{FALSE}.
##' @return value, possibly with elements transformed
##' @author Brad Friedman
validate.array.param.value <- function(app, val, transform.labeled = FALSE)  {
  prefix <- paste(sep="", "array param ", app$name, ": ")
  .validate.type(val, type = is.list, prefix=prefix)

  val.len <- length(val)
  app$min <= val.len || stop(prefix, "length(val) = ", val.len, " < min length (", app$min, ")")
  val.len <= app$max || stop(prefix, "max length (", app$max, ") < length(val) = ", val.len)

  tval <- lapply(val, function(v) validate.param.value(app$prototype, v, transform.labeled=transform.labeled))

  return(tval)
  
}

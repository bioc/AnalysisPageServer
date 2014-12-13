## The functions to validate specific param types, like .validate.param.combobox, are with the constructors
## for those param types in params.R. This file has non-type-specific functions, as well as functions to
## check for type equality, and to perform paramset-level and app-level (list of paramsets) validation
##
## These functions check that AnalysisPageParam's are well-constructed objects. To check that a value
## is valid for a particular param you use validate.param.list


##' Get the controlled vocabulary of parameter size words
##'
##' Returns the controlled vocabulary of parameter size words
##' @title known.param.sizes
##' @return Character vector
##' @author Brad Friedman
known.param.sizes <- function()  {
  .known.param.sizes <- c("x-small", "small", "medium", "large", "x-large", "xx-large")
  return(.known.param.sizes)
}

.validate.known.param.size <- function(size)  {
  size %in% known.param.sizes() || stop("size '", size, "' is not among known param sizes: ", paste(collapse=" ", known.param.sizes()))
}


# Check taht pset has the same names as arguemnts of handelr; or die.
.validate.paramset.for.handler <- function(pset, handler)  {
  .validate.paramset(pset)
  all(sort(names(pset)) == sort(names(formals(handler)))) || stop("param.set names and handler arguments do not agree")
}

## Check that the arg is an AnalysisPageParamSet;
##    that it has names;
##    that they are unique;
##    that they match the "name" field;
##    that each entry is a valid AnalysisPageParam;
##    that dependent params of combobox params are all present in the paramset, or available from the parent
##    that show.if params are present in the paramset.
.validate.paramset <- function(pset, parent.parnames = character())  {
  is(pset, "AnalysisPageParamSet") || stop("pset is not an AnalysisPageParamSet: ", paste(collapse=" ", is(pset)))
  length(pset) == 0 && return()  ## empty pset always validates

  is.null(names(pset)) && stop("pset is not named")

  parnames <- sapply(pset, "[[", "name")
  dup.parnames <- names(which(table(parnames)>1))
  length(dup.parnames) == 0 || stop("Duplicate parameter names not permitted in the same request: ", paste(collapse=" ", dup.parnames))

  all(parnames == names(pset)) || stop("$names of parameters don't agree with names(pset)")

  ## include parent.parnames as being available for dependent and show.if
  parnames <- unique(c(parnames, parent.parnames))

  parnames.string <- paste(collapse=" ", parnames)
  
  for(param in pset)  {
    .validate.param(param, parnames)

    if("dependent" %in% names(param))  {
      missing.params <- setdiff(param$dependent, parnames)
      if(length(missing.params > 0))  {
        mp.string <- paste(collapse=" ", missing.params)
        stop("Parameter ", param$name, " has dependent parameters (", mp.string, ") not among the parameters in the set: ", parnames.string)
      }
    }

    if(!is.null(param$display.callback))  {
      missing.params <- setdiff(param$display.callback$dependent, parnames)
      if(length(missing.params > 0))  {
        mp.string <- paste(collapse=" ", missing.params)
        stop("Parameter ", param$name, " has display.callback-dependent parameters (", mp.string, ") not among the parameters in the set: ", parnames.string)
      }
    }

    if(!is.null(param$show.if))
      param$show.if$name %in% parnames || stop(param$name, "$show.if$name = ", param$show.if$name, " is not among the parameters in the set: ", parnames.string)
  }
  
  return()
}



.equal.param.type.select <- function(app1, app2, prefix="")  {
  in.1.not.2 <- setdiff(app1$choices, app2$choices)
  length(in.1.not.2) == 0 || stop(prefix, "select param choices in first but not second: ", paste(collapse=" ", in.1.not.2))
  in.2.not.1 <- setdiff(app2$choices, app1$choices)
  length(in.2.not.1) == 0 || stop(prefix, "select param choices in second but not first: ", paste(collapse=" ", in.2.not.1))
}

.equal.param.type.combobox <- function(app1, app2, prefix="")  {
  app1$uri == app2$uri || stop(prefix, "combobox param uris differ: ", app1$uri, " != ", app2$uri)
}

.equal.param.type.compound <- function(app1, app2, prefix="")  {
  in.1.not.2 <- setdiff(names(app1$children), names(app2$children))
  length(in.1.not.2) == 0 || stop(prefix, "compound child params in first but not second: ", paste(collapse=" ", in.1.not.2))
  in.2.not.1 <- setdiff(names(app2$children), names(app1$children))
  length(in.2.not.1) == 0 || stop("prefix. compound child params in second but not first: ", paste(collapse=" ", in.2.not.1))

  for(child.name in names(app1$children))
    .equal.param.type(app1$children[[child.name]], app2$children[[child.name]], paste(sep="", prefix, "compound.", child.name, ": "))
}


.equal.param.type.array <- function(app1, app2, prefix="")  {
  .equal.param.type(app1$prototype, app2$prototype, paste(sep="", prefix, "array.prototype: "))
}


## Check that all params pointing to the same persistent variable are of the same type.
## The type of a complex params are recursively checked. The reason for this check is
## that the value set in one param will be applied to the others. So they have to be
## the same!
## Returns void unless it throws an error message.
## Then, if a sub-test function exists for that type of param, it is called
.equal.param.type <- function(app1, app2, prefix="")  {
  app1$type == app2$type || stop(prefix, "Different types: ", app1$type, " != ", app2$type)

  subtest.name <- paste(sep=".", ".equal.param.type", app1$type)
  if(exists(subtest.name, mode="function"))  {
    subtest <- get(subtest.name, mode="function")
    subtest(app1, app2, prefix)
  }
}


# helper function for .validate.persistent.params---takes a list of AnalysisPageParamSets
# and returns a list of AnalysisPageParam's therein that have "persisent" attribute,
# split by their attribute value. So you ge
# retval[[persistent.name]] is a list of all the AnalysisPageParam's in any of the input
# param.sets that have the attrbitue persitent set to persistent.name.
.extract.persistent.params <- function(param.sets)  {

  persistent.params.by.pset <- lapply(param.sets, function(ps) Filter(function(param) "persistent" %in% names(param), ps))
  all.persistent.params <- unname(unlist(persistent.params.by.pset, recursive=FALSE))

  length(all.persistent.params) == 0 && return(list())
  
  by.persist.name <- split(all.persistent.params, sapply(all.persistent.params, "[[", "persistent"))

  return(by.persist.name)
}


# param.sets is a list of AnalysisPageParamSet objects
# They are scanned for params with "persistent" attributes, and then those
# have such are grouped by the name of the attribute. Then, for each group,
# they are all checked against the first one for being of equal param type.
.validate.persistent.params <- function(param.sets)  {
  # make sure I have a list of AnalysisPageParamSets
  stopifnot(is.list(param.sets))
  if(length(param.sets) == 0)  return()  ## fine, nothing to validate
  stopifnot(sapply(param.sets, is, "AnalysisPageParamSet"))

  pp.groups <- .extract.persistent.params(param.sets)

  ## No persistent params? Nothing to check---I'm done!
  length(pp.groups) == 0 && return()

  for(i in 1:length(pp.groups))  {
    pp.gp <- pp.groups[[i]]
    if(length(pp.gp) > 1)  {
      param.name <- names(pp.groups)[[i]]
      for(j in 2:length(pp.gp))  {
        prefix <- paste(sep="", "Persistent param '", param.name, "' #", j, " differs from #1: ")
        .equal.param.type(pp.gp[[1]],
                          pp.gp[[2]],
                          prefix=prefix)
      }
    }
  }
}


# not exported--- this is the "abstract" base constructor
new.datanode <- function(type, name, value, label=name, description=label,
                         warnings = character())  {
  
  retval <- list(type=type,
                 name=name,
                 label=label,
                 description=description,
                 value=value)
  if(length(warnings) > 0)  retval$warnings <- warnings
  
  class(retval) <- "AnalysisPageDataNode"

  return(retval)
}


.validate.datanode <- function(node, prefix = "")  {
  .validate.type(node, "AnalysisPageDataNode", prefix)
  .validate.list.with.names(node, c("type", "name", "label", "description", "value"),
                            optional.names = "warnings",
                            prefix = paste(prefix, "data node: "))
  
  for(param in c("type", "name", "label", "description"))
    .validate.string(node[[param]], paste(prefix, "$", param, ": "))

  if(!is.null(node$warnings))  {
    .validate.type(node$warnings, is.character)
    .validate.type(node$warnings, is.vector)
  }
  
  type <- node$type
  constructor.name <- paste(sep=".", "new.datanode", type)
  exists(constructor.name) || stop(prefix, "data node is not of a known type: ", type)

  validator.name <- paste(sep=".", ".validate.datanode", type)
  ## every constructor should have a companion validator or this is a structural issue
  stopifnot(exists(constructor.name))
  
  validator <- get(validator.name)
  validator(node, prefix)
}



##' Construct a new simple-type data node
##'
##' Construct a new simple-type data node. A simple data node must have either a NULL value
##' or a "scalar" value, which means length 1 atomic
##' @title new.datanode.simple
##' @param name Name of the node
##' @param value The value
##' @param ... Passed through to \code{new.datanode}, in particular \code{label} and \code{description}
##' @return AnalysisPageDataNode
##' @author Brad Friedman
##' @seealso \code{\link{is.atomic}}
##' @export
##' @examples
##' new.datanode.simple(name = "x", value = 100)
new.datanode.simple <- function(name, value, ...)  new.datanode("simple", name, value, ...)

.validate.datanode.simple <- function(node, prefix)  {
  is.null(node) && return()
  .validate.scalar(node$value, prefix)
}



##' Construct a new HTML-type data node
##'
##' Construct a new HTML-type data node. An HTML-type data node is like a simple data node but
##' it has an HTML string or character vector as its value. It should be rendered as-is, but
##' with activated analysis-page-data-set containers.
##' @title new.datanode.html
##' @param name Name of the node
##' @param value The value, an HTML string or charvec.
##' @param ... Passed through to \code{new.datanode}, in particular \code{label} and \code{description}
##' @return AnalysisPageDataNode
##' @author Brad Friedman
##' @seealso \code{\link{is.atomic}}
##' @export
##' @examples
##' new.datanode.html(name = "shakespeare",
##'                   value = "<i>Shall I compute thee to a summer's data?</i>")
new.datanode.html <- function(name, value, ...)  new.datanode("html", name, value, ...)

.validate.datanode.html <- function(node, prefix)  {
  is.null(node) && return()
  .validate.type(node$value, "character", prefix)
}



##' Construct a new table-type data node
##'
##' Construct a new table-type data node either from an \code{AnnotatedDataFrame}.
##' @title new.datanode.table
##' @param name Name of the node
##' @param data An \code{AnnotatedDataFrame}. Unless "label" is already available,
##' "labelDescription" in the \code{varMetadata} will be
##' changed to "label" to agree with the syntax we use in the rest of the AnalysisPage interface.
##' @param caption Caption for the table. Default: ""
##' @param ... Passed through to \code{new.datanode}, in particular \code{label} and \code{description}
##' @return AnalysisPageDataNode
##' @author Brad Friedman
##' @note Captions for plots are included implicitly in the table component of their responses.
##' @export
new.datanode.table <- function(name, data, caption="", ...) {
  stopifnot(is(data, "AnnotatedDataFrame"))

  ## change "labelDescription" to "label" in meta-data (unless both are present)
  vmd <- varMetadata(data) 
  if(!"label" %in% names(vmd) && "labelDescription" %in% names(vmd))
    names(vmd)[names(vmd) == "labelDescription"] <- "label"

  
  new.datanode("table", name,
               list(data = data.frame.to.list(pData(data)),
                    meta = data.frame.to.list(vmd),
                    caption = caption),
               ...)
}

.validate.datanode.table <- function(node, prefix)  {
  .validate.list.with.names(node$value, c("data", "meta", "caption"),
                            prefix = paste(prefix, "table datanode value: "))
  
  .validate.data.frame.list(node$value$data)
  .validate.data.frame.list(node$value$meta)
  .validate.type(node$value$caption, "character", paste(sep="$", "caption"))

  if(length(node$value$data) >= 1)  {
    colnames.from.data <- names(node$value$data[[1]])
    colnames.from.meta <- names(node$value$meta)
    identical(colnames.from.data, colnames.from.meta) || stop(prefix, " colnames from meta and data don't agree:\n  meta: ",
                                                              paste(collapse = " ", colnames.from.meta), "\n  data: ",
                                                              paste(collapse = " ", colnames.from.data))
  }
}



##' Construct a new plot-type data node
##'
##' Construct a new plot-type data node from a plot.file and an AnnotatedDataFrame.
##' Note: caption is included implicitly in the table object.
##' @title new.datanode.plot
##' @param name Name of the node
##' @param plot.file Path to plot file, relative to server tempdir.
##' @param table A table-type \code{AnalysisPageDataNode}
##' @param ... Passed through to \code{new.datanode}, in particular \code{label} and \code{description}
##' @return AnalysisPageDataNode
##' @author Brad Friedman
##' @export
new.datanode.plot <- function(name, plot.file, table, ...)  {
  stopifnot(is.character(plot.file) && length(plot.file) == 1)
  stopifnot(is(table, "AnalysisPageDataNode") && table$type == "table")
  new.datanode("plot",
               name,
               value=list(plot = plot.file,
                 table = table),
               ...)
}

  
.validate.datanode.plot <- function(node, prefix)  {
  .validate.list.with.names(node$value, c("plot", "table"),
                            prefix = paste(prefix, "plot datanode value: "))

  .validate.string(node$value$plot, paste(prefix, "$value$plot: "))

  .validate.datanode.table(node$value$table, paste(prefix, "$value$table: "))
}
  


##' Construct a new array-type data node
##'
##' Construct a new array-type data node from a list of \code{AnalysisPageDataNode}s
##' @title new.datanode.array
##' @param name Name of the node
##' @param children List of \code{AnalysisPageDataNode}s
##' @param ... Passed through to \code{new.datanode}, in particular \code{label} and \code{description}
##' @return AnalysisPageDataNode
##' @author Brad Friedman
##' @export
##' @examples
##' html.node <- example(new.datanode.html)$value
##' simple.node <- example(new.datanode.simple)$value
##' new.datanode.array(name = "arr", children = list(html.node, simple.node))
new.datanode.array <- function(name, children, ...)  {
  stopifnot(is.list(children))
  stopifnot(length(children) == 0 || sapply(children, is, "AnalysisPageDataNode"))
  new.datanode("array", name, value=children, ...)
}

.validate.datanode.array <- function(node, prefix)  {
  .validate.type(node$value, "list", paste(prefix, "$value: "))

  length(node$value) == 0 && return()
  
  for(i in 1:length(node$value))  {
    child <- node$value[[i]]
    .validate.datanode(child, paste(prefix, "$value[", i, "]: "))
  }
}



##' Create a list representation of a data.frame
##'
##' We represent a data.frame as an hash of hashes.
##' Factors are first coerced into characters.
##'
##' The outer hash is keyed by the rownames of your data.frame
##' The inner hash is keyed by the colnames of your data.frame
##' @title data.frame.to.json
##' @param df data.frame to represent as a list
##' @return list
##' @author Brad Friedman
##' @examples
##' df <- data.frame(A=1:3, B=3:1, C=factor(c("foo","bar","foo")), row.names = c("one", "two", "three"))
##' ## Should give the following
##' ## list(one=list(A=1, B=3, C="foo"),
##' ##      two=list(A=2, B=2, C="bar"),
##' ##      three=list(A=3, B=1, C="foo"))
##' data.frame.to.list(df)
##' @export
##' @examples
##' data.frame.to.list(head(cars))
data.frame.to.list <- function(df)  {

  if(nrow(df) == 0)  {
    ## kind of hard to make an empty (length 0) named list.
    empty.named.list <- list()
    names(empty.named.list) <- character(0)
    return(empty.named.list)
  }

    
  ## We return an ARRAY of HASHES

  ## First cast factors to characters
  if(ncol(df) > 0)  for(i in 1:ncol(df))  if(is.factor(df[[i]]))  df[[i]] <- as.character(df[[i]])

  ## drop = FALSE is important here because otherwise in the case where there is just
  ## 1 column the row will be demoted to a scalar thing without the column name
  list.of.rows <- lapply(1:nrow(df), function(i) as.list(df[i,,drop=FALSE]))
  names(list.of.rows) <- rownames(df)
  return(list.of.rows)
}


.validate.data.frame.list <- function(dfl, prefix="")  {
  is.list(dfl) || stop(prefix, "data.frame.list must be a list: ", paste(collapse=" ", is(dfl)))
  is.null(names(dfl)) && stop(prefix, "data.frame.list must have row names")
  length(dfl) == 0 && return()  # empty list---nothing else to validate

  non.list <- !sapply(dfl, is.list)
  sum(non.list) == 0 || stop(prefix, "entries in data.frame.list are not lists: ", paste(collapse=" ", which(non.list)))
  
  unnamed <- sapply(dfl, function(x) is.null(names(x)))
  sum(unnamed) == 0 || stop(prefix, "entries in data.frame.list are unnamed: ", paste(collapse=" ", which(non.list)))

  is.list.of.scalars <- sapply(dfl, function(x) all(sapply(x, length) == 1) && all(sapply(x, is.atomic)))
  sum(!is.list.of.scalars) == 0 || stop(prefix, "entries in data.frame.list are not lists of scalars: ", paste(collapse=" ", which(!is.list.of.scalars)))
  
  if(length(dfl) > 1)  {
    cn <- names(dfl[[1]])
    for(i in 2:length(dfl))  {
      identical(cn, names(dfl[[i]])) || stop(prefix, "names of entry ", i, " do not agree with those of entry 1")
    }
  }
}  


.validate.list.with.names <- function(l, expected.names, optional.names = character(), prefix="")  {
  .validate.type(l, is.list, prefix)
  n.names <- length(expected.names)
  identical(names(l)[1:n.names], expected.names) || stop(prefix, " names differ from expected.\n",
                                                         "  expected: ", paste(collapse=" ", expected.names), "\n",
                                                         "       got: ", paste(collapse=" ", names(l)))
  unknown.names <- setdiff(names(l), c(expected.names, optional.names))
  length(unknown.names) == 0 || stop(prefix, " unknown names: ", paste(collapse = " ", unknown.names))
}

## type can be character then do is(obj, type) or it can be a function like is.list then do type(obj).
## turns out that is(obj,"list") is slightly different than is.list(obj)
.validate.type <- function(obj, type, prefix="")  {
  if(is.function(type))  {
    isname <- deparse(substitute(type))
    type(obj) || stop(prefix, " object fails ", isname, "': ", paste(collapse=" ", is(obj)))
  }  else  {
    is(obj, type) || stop(prefix, "object is not '", type, "': ", paste(collapse=" ", is(obj)))
  }
}

.validate.length <- function(obj, explen, prefix="")  {
  length(obj) == explen || stop(prefix, "object is not length ", explen, ": ", length(obj))
}

## string is a character of length 1
.validate.string <- function(obj, prefix="")  {
  .validate.type(obj, "character", prefix)
  .validate.length(obj, 1, prefix)
}

.validate.atomic <- function(obj, prefix="")  {
  is.atomic(obj) || stop(prefix, "is not atomic: ", paste(collase=" ", is(obj)))
}

## a scalar is an atomic of length 1
.validate.scalar <- function(obj, prefix="")  {
  .validate.atomic(obj, prefix)
  .validate.length(obj, 1, prefix)
}


## turns LETTERS into "A B C ..." and anything n or shorter just concatenate
.head.string <- function(vec, n=3)  {
  first.few <- if(length(vec) > n)  {
    c(head(vec, n), "...")
  }  else  {
    head(vec, n)
  }

  paste(collapse=" ", first.few)
}
  
.validate.unnamed <- function(obj, prefix="")  {
  length(obj) == 0 || is.null(names(obj)) || stop(prefix, "has length > 0 but has names: ", .head.string(obj))
}


.validate.named <- function(obj, prefix="")  {
  is.null(names(obj)) && stop(prefix, "has no names")
}

##' JSON-Encode an AnalysisPageDataNode for the front end
##'
##' JSON-Encode an AnalysisPageDataNode for the front end.
##' This just calls \code{toJSON}, but before doing so
##' it makes sure that \code{$warnings} will be sent
##' as an array.
##'
##' Mostly this function is only called once, from
##' the \code{$analysis} method of an \code{AnalysisPageRAapacheApp}.
##' @param datanode AnalysisPageDataNode or other object
##' @return JSON-encoded string
##' @author Brad Friedman
encode.datanode <- function(datanode)  {
  ## Make sure this is sent as an array, not a scalar
  if(is(datanode, "AnalysisPageDataNode") && !is.null(datanode$warnings))
    datanode$warnings <- as.list(datanode$warnings)

  toJSON(datanode)
}

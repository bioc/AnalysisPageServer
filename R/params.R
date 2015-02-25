
##' Build a simple AnalysisPageParam
##'
##' Build a simple AnalysisPageParam. These include mainly parameters that can be rendered simply as HTML <input> tags.
##' @title simple.param
##' @param name Name of form element
##' @param label Label for form element (typically rendered to the left of the element)
##' @param description Description for form element (typically rendered as roll-over text)
##' @param value The default, starting value, for the form (default: "")
##' @param type Type of form element. This can be "text", "textarea", "checkbox", "password" or "file"
##' @param advanced Integer. 0 means the option is not advanced, and increasing levels indicate the option
##' is for more advanced users. Advanced > 0 should be hidden under default mode.
##' @param show.if A list of two elements: \code{$name}, giving the name of some other param in the set
##' and \code{$values}, a character vector of values. The parameter under construction should only be shown if
##' the named parameter takes on any of the values in the \code{$values} vector. Default (NULL) is to always
##' show the parameter under construction.
##' @param display.callback NULL, to follow \code{show.if} logic in deciding when/if
##' to display the element, or a list with the two elements \code{$uri} and \code{$dependent},
##' which follow the same format as the corresponding arguments to \code{combobox.param} and provide
##' a templated uri and a mapping from template variables to form parameters. The service should
##' return JSON true if the widget is to be shown and false if not. It is allowed to
##' have both a \code{display.callback} and a \code{show.if}---both conditions must be
##' met in order to display the element.
##' @param size A word giving the size of the element. The interpretation of this size is up to the front-end.
##' Must from a defined set of words, which you can see by calling \code{known.param.sizes()} (currently
##' no way to change this). Default: medium
##' @param required Logical. Is this a required param? Default: TRUE. If set, then the front-end will
##' the front-end user is required to set this parameter before submitting the request. The meaning of
##' "set this parameter" is not entirely clear.
##' @param persistent Character or NULL. If non-NULL then it is passed to the front-end. It names a
##' variable in persistent storage that should be used to initialize the value of the parameter.
##' The front end will provide some mechanism to change the persistent value, but until the user does
##' so the param will be initialized from the value in the persistent space.
##' @param persistent.dependencies A character vector or NULL (default) specifying the names
##' of other parameters on
##' which this one "depends". It is an error to provide this when \code{persistent} is NULL.
##' When \code{persistent} is non-NULL, providing \code{persistent.dependencies} makes this parameter
##' not just "persistent" but "conditionally persistent", which
##' is to say that the persistent value for this parameter is actually a hash lookup based on the
##' the other parameters specified in this vector. A typical example would be a pheno fields parameter
##' which is dependent on the study parameter. The names are taken from the Page namespace, which
##' means that a parameter's \code{$name} is used when this differs from its \code{$persistent}
##' slot.
##' @return An AnalysisPageParam. This is just a list with class name slapped on.
##' @author Brad Friedman
##' @examples
##'   x <- simple.param("xmin", label="X-min", description="Minimum x value", type="text")
##' @export
simple.param <- function(name,
                         label = name,
                         description = label,
                         value = "",
                         type = "text",
                         advanced = 0,
                         show.if = NULL,
                         display.callback = NULL,
                         size = "medium",
                         required = TRUE,
                         persistent = NULL,
                         persistent.dependencies = NULL
                         )  {
  .validate.known.param.size(size)

  if(!is.null(persistent.dependencies) && is.null(persistent))
    stop("You provided persistent.dependencies but not persistent")

  param <- list(name=name,
                label=label,
                description=description,
                value=value,
                type=type,
                advanced = advanced,
                show.if=show.if,
                size=size,
                required=required)
  if(!is.null(persistent))  {
    param$persistent <- persistent
    if(!is.null(persistent.dependencies))
      param$persistent_dependencies<- persistent.dependencies
  }

  if(!is.null(display.callback))  param$display.callback <- display.callback

  class(param) <- "AnalysisPageParam"
  return(param)
}


## validate the show.if value---either NULL or a length 2 list, as described in the doc for simple.param
.validate.show.if <- function(show.if)  {
  is.null(show.if) && return()
  is.list(show.if) || stop("show.if is non-NULL and not a list")
  identical(sort(names(show.if)),
            c("name", "values"))  || stop("names(show.if) is not $name, $values: ", paste(collapse=" ", names(show.if)))
}


## validate the show.if value---either NULL or a length 2 or 3 list, as described in the doc for simple.param
.validate.display.callback <- function(display.callback)  {
  is.null(display.callback) && return()
  is.list(display.callback) || stop("display.callback is non-NULL and not a list")
  invalid.names <- setdiff(names(display.callback), c("dependent", "uri", "delay.ms"))
  length(invalid.names) == 0 || stop("Invalid name(s) in display.callback: ", paste(collapse=" ", invalid.names))
  missing.names <- setdiff(c("dependent", "uri"), names(display.callback))
  length(missing.names) == 0 || stop("Missing required name(s) from display.callback: ", paste(collapse = " ", missing.names))

  ## check that all of the templated parameters are represented in the $dependent
  ## mapping
  .validate.dependent.params(uri = display.callback$uri,
                             dependent = display.callback$dependent)
}

                              
## check that the arg is an AnalysisPageParam and has the required elements. If .validate.param.{{$type}} is a function then call it
## for type-specific checking. parent.parnmaes is passed through. This allows checking for
## availability of dependent parameters from the parent, such as for show.if, display.callback and comboboxes.
.validate.param <- function(param, parent.parnames = character())  {
  is(param, "AnalysisPageParam") || stop("param is not an AnalysisPageParam: ", paste(collapse=" ", is(param)))
  missing.elements <- setdiff(c("name","label","description","value","type","advanced","show.if","size"), names(param))
  length(missing.elements) == 0 || stop("Missing required entries in AnalysisPageParam: ", paste(collapse=" ", missing.elements))

  .validate.show.if(param$show.if)
  .validate.display.callback(param$display.callback)
  .validate.known.param.size(param$size)

  validate.type.function.name <- paste(sep="", ".validate.param.", param$type)
  if(exists(validate.type.function.name, mode="function"))  {
    validator <- get(validate.type.function.name, mode="function")
    validator(param, parent.parnames = parent.parnames)
  }
  
  return()
}


##' Build a file upload AnalysisPageParam
##'
##' Build a file upload \code{AnalysisPageParam}. This is rendered as a file upload element, to be uploaded along with the submission.
##' (Currently there is no server-side mechanism for storing uploaded files, so asynchronous upload is not possible.)
##' The description field should describe what type of file is expected.
##'
##' On the server side
##' your handler will get a list with "name", "tmp_name" and "fh"
##' elements giving the filename, and path to a local file (usually in /tmp), and the filehandle open for reading.
##' @title file.param
##' @param ... Pass through to \code{\link{simple.param}}, including at least "name" but not including "type".
##' @param template.uri URI, possibly with :-prefixed parameter names. For example "/get?x=:x;y=:y" has parameters "x" and "y". (See \code{dependent.params} next).
##' (Note: this follows the way of doing it in combobox.param). This is optional. If provided, then the front-end can use this callback to allow the user to
##' download a template. This is a template in two senses: the URI itself may be a template whose parameter values should be filled in, and the return value
##' of the request is an excel file which is a template for the user to fill in.
##' @param dependent.params A character vector whose names are parameters from the uri, and whose values are the names of other form elements. Error to provide
##' this without providing template.uri
##' @return An \code{AnalysisPageParam}
##' @author Brad Friedman
##' @examples
##'   cov.param <- file.param("cov", label="Covariate Data", description="A two-column Excel file, first column being the sample ID (SAMID) and second being covariate data (with the name of the variable in the header)")
##' @export
file.param <- function(..., template.uri=NULL, dependent.params=NULL)  {
  param <- simple.param(..., type="file")
  if(is.null(template.uri) && !is.null(dependent.params))
    stop("You supplied dependent.params without supplying template.uri")
  param$template.uri <- template.uri
  param$dependent <- dependent.params
  return(param)
}

.validate.dependent.params <- function(uri, dependent, n.param=NULL)  {
  param.pos <- gregexpr(":\\w+\\b", uri)[[1]]
  uri.params <- if(param.pos[1] == -1)  {
    character(0)
  }  else  {
    match.length <- attr(param.pos, "match.length")
    substring(uri, param.pos+1, param.pos + match.length-1)
  }
  ## The as.character() casts NULL to character, which is important if there
  ## are no params
  reqd.pars <- as.character(c(names(dependent), n.param))
  ## Note that it is possible that uri.params will contain things
  ## not in reqd.pars. That is fine---they will not be template-substituted.
  ## This can happen (a lot) if the URI contains JSON-encoded values.
  missing.pars <- setdiff(reqd.pars, uri.params)
  length(missing.pars) == 0 || stop("Dependent parameters [",
          paste(collapse = "missing.pars"), "] not templated in URI: ",
          uri)
}


.validate.param.file <- function(param, parent.parnames = character())  {
  if(!is.null(param$template.uri))
    .validate.dependent.params(uri=param$template.uri,
                               dependent=param$dependent)
}





##' Build a select AnalysisPageParam
##'
##' Build a select AnalysisPageParam. This is probably rendered either as a dropdown or radio group. It is a selection from a fixed
##' list of possible values. The list is known before page load time
##' @title select.param
##' @param ... Passed through to \code{\link{simple.param}}. This includes at least "name", optionally "label" and "description" 
##'t not "type".
##' @param value Default value. If not specified then the first entry in choices is taken to be the default.
##' @param choices A character vector giving the choices to display. If named, then the values are used for display and names are used
##' for the actual form values. If unnamed, then the values are used for both display and names.
##' @param allow.multiple If TRUE then render as checkbox group and allow multiple selections. (The function
##' will be provided a vector of all selected values.) If \code{allow.multiple} is TRUE then \code{style} must be "dropdown".
##' Default: FALSE
##' @param style Either "dropdown" (default), to render as dropdown list, or "radio", to render as radio group.
##' If \code{allow.multiple} is TRUE then \code{style} must be "dropdown".
##' @return An AnalysisPageParam
##' @author Brad Friedman
##' @examples
##'   color <- select.param("color", label="Color", description="Color of your house", choices=c("red","green","mauve","tope"))
##' @export
select.param <- function(..., value, choices,
                         allow.multiple = FALSE,
                         style = "dropdown")  {
  if(is.null(names(choices)))  names(choices) <- choices
  
  if(missing(value))  {
    if(length(choices) > 0)  {
      value <- names(choices)[1]
    }  else  {
      value <- ""
    }
  }

  stopifnot(length(choices) == 0 || value %in% names(choices))
  
  param <- simple.param(..., value = value, type="select")
  param$choices <- choices
  style %in% c("dropdown", "radio") || stop("style must be 'dropdown' or 'radio', you gave '", style, "'")
  param$style <- style
  param$allow_multiple <- allow.multiple

  return(param)
}

.validate.param.select <- function(param, parent.parnames = character())  {
  is.character(param$choices) || stop("param$choices is not character: ", paste(collapse=" ", is(param$choices)))
  param$style %in% c("dropdown", "radio") || stop("style must be 'dropdown' or 'radio', you gave '", param$style, "'")
  is.logical(param$allow_multiple) || stop("allow_multiple must be a logical: ", paste(collape= " ", is(param$allow_multiple)))
  length(param$allow_multiple == 1) || stop("length(allow_multiple) is not 1: ", length(param$allow_multiple))
  if(param$allow_multiple && param$style != "dropdown")
    stop("style must be 'dropdown' with allow_multiple=TRUE")
}





##' Build a slider AnalysisPageParam
##'
##' Build a slider AnalysisPageParam. This is a numeric variable. It has a minimum value, a maximum value, and a step size
##' @title slider.param
##' @param ... Passed through to \code{\link{simple.param}}. This includes at least "name", optionally "label" and "description" 
##' but not "type".
##' @param min Minimum value (number)
##' @param max Maximum value (number)
##' @param step Size of one step (must be <= max-max)
##' @param value Default value. If not specified then the minimum is taken to be the default
##' @return An AnalysisPageParam
##' @author Brad Friedman
##' @examples
##'   slider <- slider.param("children", label="No. Children", description="Number of Children", min = 0, max = 10, step = 0.5)
##' @export
slider.param <- function(..., min, max, step, value = min)  {
  min < max || stop("min (", min, ") must be >= max (", max, ")")
  step <= (max- min) || stop("step (", step, ") is greater than max-min (", max-min, ")")
  step > 0 || stop("step (", step, ") is not > 0")

  param <- simple.param(..., value = value, type="slider")
  param$min <- min
  param$max <- max
  param$step <- step

  return(param)
}


.validate.param.slider <- function(param, parent.parnames = character())  {
  is.numeric(param$min) || stop("param$min is not numeric: ", paste(collapse=" ", is(param$min)))
  is.numeric(param$max) || stop("param$max is not numeric: ", paste(collapse=" ", is(param$max)))
  is.numeric(param$step) || stop("param$step is not numeric: ", paste(collapse=" ", is(param$step)))

  for(pname in c("min", "max", "step"))
    length(param[[pname]]) == 1 || stop("param$", pname, " should have length one, but it has length ", length(param[[pname]]))

}




##' Build a boolean AnalysisPageParam
##'
##' Build a boolean AnalysisPageParam. This is probably rendered as a checkbox. The value returned to
##' the server should be either JSON "true" (corresponding to checked) or JSON "false".
##'
##' If you do not provide a value (or if you provide value="", which is what happens in the parent
##' constructor \code{simple.param} when you don't provide a value) then the default will be FALSE.
##' @title bool.param
##' @param ... Passed through to \code{\link{simple.param}}. This includes at least "name", and optionally
##' "label", "description" and "value" (which should be either \code{TRUE} or \code{FALSE}),
##' but not "type".
##' @return An AnalysisPageParam
##' @author Brad Friedman
##' @examples
##'   show.ids <- bool.param("show_ids", label="Show IDs", description="Show sample IDs on the plot", value=TRUE)
##' @export
bool.param <- function(...)  {
  param <- simple.param(..., type="bool")

  if(param$value == "")  param$value <- FALSE
  
  return(param)
}

.validate.param.bool <- function(param, parent.parnames = character())  {
  is.logical(param$value) || stop("default value ", paste(collapse=":", param$value), " is not logical: ",
                                  paste(collapse=" ", is(param$value)))
  length(param$value) == 1 || stop("default value has length ", length(param$value), " != 1")
}









##' Build a combobox AnalysisPageParam
##'
##' Build a combobox AnalysisPageParam. This is a widget with both text and drop-down. However, the values in the drop-down
##' depend on an AJAX query whose URI is built from current form element values, possibly including the current widget (namely
##' the text typed so far). The drop-down values should be updated
##' whenever one of the depenedent elements changes.
##'
##' @title combobox.param
##' @param ... Passed through to \code{\link{simple.param}}. This includes at least "name", optionally "label", "description" and "value", but not "type".
##' @param uri URI, possibly with :-prefixed parameter names. For example "/get?x=:x;y=:y" has parameters "x" and "y". (See \code{dependent.params} next)
##' @param dependent.params A character vector whose names are parameters from the uri, and whose values are the names of other form elements.
##' @param prompt A prompt to display in disabled style before user starts typing (for self-dependent comboboxes only). Default is "Enter search term".
##' @param n.param The name of a parameter that controls the maximum number of search hits, if the URL has such a parameter. Default is NULL, which
##' means it does not have a parameter. If it does have such a parameter, then 0 means to return all hits, and otherwise a positive integer will
##' limit the number of hits returned.
##' @param allow.multiple If TRUE then render search hits as checkbox group and allow multiple selections. (The function
##' will be provided a vector of all selected values.) If the search term changes then the old values
##' are still accumulated. If other dependent parameter changes then they are reset.
##' Default: FALSE
##' @param response.type A string. "simple" means that the response will be a simple array
##' of strings. The "id-long_name-reason" type is a special type for search hits, where an array of hashes is returned, each
##' hash having "id", "long_name" and "reason" components.
##' @param delay.ms Delay, in milliseconds, that the front-end should wait after keystrokes or paste before submitting queries. Default, 0, means no delay.
##' @inheritParams simple.param
##' @param extra.persistent.dependencies Character vector specifying names of other parameters on which this one is conditionally persistent. See arg
##' \code{persistent.dependencies} in \code{\link{simple.param}}. Whatever is provided in \code{extra.persistent.dependencies}
##' is taken \emph{in addition to} with \code{unname(dependent.params)}. This is because
##' if a combobox is persistent then it must be so conditional on its dependent parameters.
##' It is an error to specify this for a non-persistent parameter.
##' @return An AnalysisPageParam
##' @author Brad Friedman
##' @examples
##'   ## Note the :query parameter is dependent on the same gene element. This makes it a type-ahead query.
##'   gene <- combobox.param(name="gene", uri="/find_gene_id/:genome/:query/", dependent.params=c(genome="genome", query="gene"), response.type="id-long_name-reason")
##' @export
combobox.param <- function(..., uri, dependent.params, prompt = "Enter search term", n.param=NULL,
                           allow.multiple = FALSE,
                           response.type="simple",
                           persistent = NULL,
                           extra.persistent.dependencies = NULL,
                           delay.ms = 0)  {
  ## A dynamic list of options. The list is not known before page load time. It has to be found out by an AJAX request.
  ## This is made after substituting :-prefixed parameters in the uri according to the current values of other fields,
  ## specified in dependent.params.
  ##
  ## These dynamic lists are either populated as a dropdown---with the list updated by AJAX call whenever the value of
  ## one of the dependent parameters changes---or during typeahead, with the current value provided as one of the parameters.
  ## Its actually the same thing---the second is a special case of the first, where the same element is one of the dependnet values.

  if(!is.null(persistent))  {
    persistent.dependencies <- unique(c(unname(dependent.params),
                                        extra.persistent.dependencies))
  }  else  {
    persistent.dependencies <- NULL
  }
  param <- simple.param(..., type="combobox",
                        persistent = persistent,
                        persistent.dependencies = persistent.dependencies)
  param$uri <- uri
  param$dependent <- dependent.params
  param$response.type <- response.type
  param$prompt <- prompt
  param$allow_multiple <- allow.multiple
  param$delay.ms <- delay.ms
  ## the following weird construction forces incorporate the $n.param element into the list even when it is NULL.
  ## If you do
  ##   listvar$elem <- NULL
  ## it has no effect if $elem is not already in the list, and it actually delete the element if it is already in the
  ## list
  ## And there is further weirdness in that the c(., list())  construction will strip the param of its class!
  save.class <- class(param)
  param <- c(param, list(n.param= n.param))
  class(param) <- save.class
  
  return(param)
}

.validate.param.combobox <- function(param, parent.parnames = character())  {
  .validate.dependent.params(uri=param$uri,
                             dependent=param$dependent,
                             n.param=param$n.param)
  is.null(param$delay.ms) || (is.numeric(param$delay.ms) && param$delay.ms >= 0) || stop("delay.ms must be a non-negative number: ", param$delay.ms)
  
  is.logical(param$allow_multiple) || stop("allow_multiple must be a logical: ", paste(collape= " ", is(param$allow_multiple)))
  length(param$allow_multiple == 1) || stop("length(allow_multiple) is not 1: ", length(param$allow_multiple))
}









##' Create a Compound AnalysisPageParam
##'
##' A compound AnalysisPageParam is a single parameter that has multiple parts.
##' The parts are represented by an AnalysisPageParamSet, so could be arbitrarily
##' nested. The front end is responsible for wrapping up all of the values
##' in a JSON hash and passing in a single value.
##'
##' This can be thought of as a way of building a hash out of other parameter types.
##' @title compound.param
##' @param ... Passed through to \code{\link{simple.param}}. This includes at least "name", optionally "label" and "description".
##' but not "type" (which is set to "compound") or "value" (which is set to empty string, but ignored anyway, since each of the
##' contained parameters will have its own value).
##' @param children AnalysisPageParamSet An AnalysisPageParamSet representing all of the nested parameters
##' @return AnalysisPageParam of type "compound"
##' @author Brad Friedman
##' @examples
##'   plist <- list(simple.param(name="study"), simple.param(name="comp"), simple.param("feature.type", value="gene"))
##'   comp <- compound.param(name="comp", label="Comparison", children=param.set(plist))
##' @export
compound.param <- function(..., children)  {
  param <- simple.param(..., type="compound", value="")
  param$children <- children
  return(param)
}

.validate.param.compound <- function(param, parent.parnames = character())  {
  .validate.paramset(param$children, parent.parnames = parent.parnames)
}








##' Create an Array AnalysisPageParam
##'
##' An array AnalysisPageParam is a way of having a single parameter with
##' multiple repetitions of some other (fixed) parameter type. The
##' starting length, as well as minimum and maximum allowable lengths,
##' are provided. If min != max then the front end should render some
##' widget to add/remove elements.
##'
##' By combining with \code{compound.param} a fairly complex data
##' structure can now be specified.
##' @title array.param
##' @param ... Passed through to \code{\link{simple.param}}. This includes at least "name", optionally "label" and "description".
##' but not "type" (which is set to "array") or "value" (which is set to empty string, but ignored anyway, since the
##' prototype parameter will have its own value).
##' @param prototype A single AnalysisPageParam that is the prototype for each of the elements in the array. Note
##' that while only one param is allowed, it could potentially be either a compound or another array parameter.
##' @param start The starting length of the array that should be rendered
##' @param min The minimum allowed length of the array. Buttons to remove elements should be de-activated below this level (default 0).
##' @param max The maximum allowed length of the array. Buttons to add elements should be de-activated above this level (default Inf).
##' @return AnalysisPageParam of type "array"
##' @examples
##'   one.gene <- simple.param(name="gene", label="Gene Symbol")
##'   gene.set <- array.param(name="geneset", prototype=one.gene)
##' @author Brad Friedman
##' @export
array.param <- function(..., prototype, start=1, min=0, max=Inf)  {
  stopifnot(min <= start)
  stopifnot(start <= max)
  param <- simple.param(..., type="array", value="")
  param$prototype <- prototype
  param$start <- start
  param$min <- min
  param$max <- max
  return(param)
}

.validate.param.array <- function(param, parent.parnames = character())  {
  .validate.param(param$prototype, parent.parnames = parent.parnames)
}



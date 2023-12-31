
.request.env <- list2env(list())

.errorMsgDelim <- "---===---===---===---===---"

##' Get/set section name for "messages" section
##'
##' Any \code{message}s thrown during execution of a page handler
##' are display in a new section of the accordion. This controls
##' the name. This is reset to "Messages" for each page, but
##' the page can call this function to get or set the name.
##'
##' Note that all messages thrown will be collected at the end
##' and made into this single section.
##' Therefore, if the message section is renamed after throwing a message then
##' both the old and any newer messages will appear under the new name.
##'
##' If a section of the same name is created using \code{\link{appendCustomContent}}
##' then these messages will just be appended to the end.
##' @param sectionName If present, new section name (e.g.
##' "Your Messages").
##' @return A string, the section name for the messages section
##' @author Brad Friedman
##' @export
messageSectionName <- function(sectionName)  {
  if(!missing(sectionName))
    assign("messageSection", sectionName, pos = .request.env)
  .request.env$messageSection
}

##' Functions to manage custom content other aspects of the request-specific environment
##'
##' Custom content are HTML rendered
##' as additional accordion sections. From the data structure
##' point of view these are represented as a named of list
##' of character vectors. The names are the section headers.
##' Use \code{\link{appendCustomContent}} to add more content.
##' @return \code{getCustomContent} returns named list of character vectors
##' @author Brad Friedman
##' @export
##' @examples
##' appendCustomContent(sectionName = "foo", content = c("<i>bar</i><br>","<b>baz</b>"))
##' getCustomContent()
##' clearRequestEnv()
##' @rdname requestEnv
getCustomContent <- function()  {
  .request.env$custom
}

##' \code{appendCustomContent} adds custom content to be rendered in separate accordion section
##' @param sectionName Name of section (string)
##' @param content Character vector of HTML content to append
##' @return \code{appendCustomContent} does not return anything good.
##' @export
##' @rdname requestEnv
appendCustomContent <- function(sectionName, content)  {
  (is.character(content) && is.vector(content)) || stop("New content must be character vector: ",
                                                        paste(collapse = " ", is(content)))

  customList <- .request.env$custom
  if(is.null(customList))
    customList <- list()
  existingContent <- customList[[sectionName]]  ## might be NULL---that's fine
  newContent <- c(existingContent, content)

  customList[[sectionName]] <- newContent
  
  assign("custom", customList, pos = .request.env)
}


.appendMessagesToCustomContent <- function(handler.messages)  {
  if(length(handler.messages) > 0)
    appendCustomContent(sectionName = messageSectionName(),
                        content = paste0("<li>", handler.messages, "</li>"))
}


##' \code{setFilterWidget} sets the filter widget for the current analysis. This is the
##' function most commonly used.
##' @inheritParams new.filter.widget
##' @return \code{setFilterWidget} returns the newly set AnalysisPageFilterWidget object 
##' @rdname filterWidget
##' @export
setFilterWidget <- function(data.field,
                            color,
                            cells,
                            inactive.color = "gray",
                            type = "filter_grid")  {
  .request.env$filter.widget <- new.filter.widget(data.field = data.field,
                                                  color = color,
                                                  cells = cells,
                                                  inactive.color = inactive.color,
                                                  type = type)
}

##' \code{getFilterWidget} retrieve the filter widget for the current analysis.
##' This is normally used internally, to construct the final response for the analysis.
##' @return \code{getFilterWidget} returns the curretn AnalysisPageFilterWidget object,
##' or NULL if it has not yet been set
##' @rdname filterWidget
##' @export
getFilterWidget <- function()  {
  .request.env$filter.widget
}



##' \code{clearRequestEnv} clears the environment associated with the last request.
##' @return \code{clearRequestEnv} does not return anything useful
##' @rdname requestEnv
##' @export
clearRequestEnv <- function()  {
  rm(list = ls(.request.env), pos = .request.env)
  messageSectionName("Messages")
  invisible()
}


##' Validate and prepare a handler for installation
##'
##' An AnalysisPage handler is a function that satistifies the following properties:
##'
##' \enumerate{
##'   \item{ Can be called with no arguments and return a valid value (to be used for
##'          testing in the next steps; although this can be relaxed with \code{skip.checks}). }
##'   \item{ It creates a plot but does not open the device (although this can be relaxed with \code{do.plot}) }
##'   \item{ It returns a data.frame with \code{x} and \code{y} fields. Alternatively it may return an \code{\link{AnnotatedDataFrame}}. (although this can be relaxed with \code{annotate.data.frame})}
##'   \item{ \code{x} and \code{y} fields are numeric.}
##'   \item{ The points in test plot can be successfully found (based on the x and y
##'          coordinates) and labeled. }
##' }
##' 
##' This function throws an error if the argument does not satistfy one of these.
##' Otherwise it returns void.
##'
##' The function will be called once at the time of running this function (typically during
##' registration) with all of its defaults to verify the second
##' and third requirements.
##'
##' The return value is a list of class "AnalysisPage" with the following components:
##' \describe{
##'   \item{ \code{$handler} }{ The handler function }
##'   \item{ \code{$params} }{ An \code{AnalysisPageParamSet} (see \code{\link{param.set}} ) }
##'   \item{ \code{$annotate.plot} }{An logical indicating whether the plots generated by the handler should be automatically annotated }
##'   \item{ \code{$class.name} }{A character giving the class to be applied to the annotated SVG elements}
##' }
##'          
##' A list will be built with the information necessary to render the page. It will
##' contain the handler function in the \code{$function} slot, as well as a \code{$params}
##' slot listing all of the parameters and their relevant information. The class name of
##' "AnalysisPage" will be slapped on this object for good measure.
##' @title new.analysis.page
##' @param handler A handler function, as described above.
##' @param param.set An AnalysisPageParamSet to use for the function. Or NULL, to call \code{\link{default.param.set}}.
##' Note that it is not a requirement that all of the function arguments be included in the param set---they just won't be provided.
##' @param annotate.plot Logical. Should plots generated by this handler be automatically annotated? Default: TRUE.
##' @param class.name Character. What class label should be applied to automatically annotated points? Default: "plot-point". (Ignored
##' if \code{annotate.plot} is FALSE.)
##' @param standard.ids Logical. By default (TRUE), the rownames of your return value are ignored, and new ones are created like
##' "Reg1","Reg2". The advantage of this is that these IDs are guaranteed to be standard-compliant HTML and SVG id tags.
##' If you want to force using your real rownames as IDs (for example, to help in debugging), then set this to FALSE (FALSE is
##' implemented but not tested).
##' Or you can provide a function with the same signature as \code{AnalysisPageServer:::make.standard.ids} that will generate
##' IDs for you (this is also implemented but not tested).
##' When annotate.plot is FALSE (for example, when a PNG is requested) the rownames are always left alone and \code{make.standard.ids}
##' is not called.
##' @param skip.checks Logical. By default (FALSE) your handler is run once on its default arguments, and it is checked
##' that it makes an SVG and that the SVG can be annotated (if annotate.plot was set). This is important to get right, but
##' doens't really need to be done during production---it just slows down the server start up.
##' @param plot.pars.transformer A function to transform plot parameters. It should have the signature \code{function(plot=list(), other=list())} and
##' return a \code{list}. The first argument is the plot parameters extracted from the user request (these are the parameters like "width" and "height"
##' that are not related to the business of the request but are simply passed through to the device function), and the second is all the other parameters
##' from the user request.
##' The functinon returns a (named) list of further arguments to pass to the device function. The main use for this is to set the image dimensions
##' based on the user request. In that case your function would
##' return a \code{list} with "width" and "height" elements. The units would be inches for svg plot. png plot uses pixel units, but if you add the
##' parameter units="in" then you can use inches units. You can do this if \code{"units" \%in\% names(formals(device))}.
##' The default \code{plot.pars.transformer=NULL} is to not transform the parameters at all.
##' @param annotate.data.frame Logical, indicating whether your return value should be passed throuhg \code{annotate.data.frame}. Default: TRUE.
##' several checks appropriate for the standard case of data associated with plotted regions.
##' @param numeric.sig.digs Number of significant digits to which numeric columns in your data should be rounded.
##' Default: 3. Set to NULL to not round (you
##' could still round within your function if you wanted tighter control). "numeric" here means either that you set the a varMetadata
##' "type" of the column to the string "numeric", or, if that is not available that \code{is(column)[1]} is "numeric". This means, in particular
##' that integer columns will not be rounded.
##' @param no.plot This page is meant to return data but no plot. Default: FALSE (it *is* expected to return a plot).
##' @param name A name for the analysis page. Defaults to deparsing the handler argument. This meant to be an internal identifier for the page,
##' only displayed to the user if label and description are unavailable.
##' @param label A display label for the page. This should be 1-3 words, to fit in the navbar. Default: name.
##' @param description A longer description for the page. This should be 1-2 sentences, to appear on rollover or in a summary page. Default: label
##' @param advanced An integer. 0 means not advanced (always display the page). 1, 2, 3 are increasing levels of advanced (only display the
##' page in advanced mode). Default: 0
##' @param thumbnail A URL for a thumbnail to use when listing the page. NULL means to not store any thumbnail.
##' @param service A logical, default FALSE. TRUE means that this page should only be called as a service and should not be rendered as a user page.
##' This also means that the return value will not be processed at all except for JSON-encoding (unless of course you return an AnalysisPageResponse).
##' @param in.menu A logical, default \code{!service}. TRUE means that the front-end should display this page in the menu. FALSE means that the front-end
##' should not display the page in the menu, but should still be ready to render it, for example by app state link (contrast with \code{service}
##' which the front end can't do anything with except provide a download link or use (as a service) to populate an input widget). The special
##' condition \code{service = FALSE}, \code{in.menu = TRUE} builds a Page that the front end can use but doesn't show up in the menu.
##' The combination of \code{service = TRUE}, \code{in.menu = TRUE}, doesn't make any sense and leads to an error.
##' @param paramset.transformer A function which accepts a named list of parameter values as its first argument and possibly
##' the AnalysisPage object as its second argument, and returns a named list of parameter values. This transformation is applied
##' last, \emph{after} the individual parameters have been transformed, if applicable, but (of course) before the handler is called.
##' Or NULL (default) to not do this transformation. The purpose of this is to be able to encode some reusable logic here for
##' groups of parameters which would often be used together but whose transformation is inter-dependent.
##' If both this argument and \code{plot.pars.transformer} are supplied then this transformation is applied first.
##' @return See above
##' @author Brad Friedman
##' @examples
##' page <- new.analysis.page(AnalysisPageServer:::sine.handler)
##' registry <- register.page(new.registry(), "sine", page)
##' ## Note: above is equivalent to the following:
##' ## registry <- register.page(registry, "sine", AnalysisPageServer:::sine.handler)
##' @seealso \code{\link{register.page}}, \code{\link{execute.handler}}, \code{\link[Biobase]{AnnotatedDataFrame}}
##' @export
##' @import methods
new.analysis.page <- function(handler,
                              param.set=NULL,
                              annotate.plot=TRUE,
                              class.name="plot-point",
                              standard.ids=TRUE,
                              skip.checks=FALSE,
                              plot.pars.transformer=NULL,
                              annotate.data.frame=TRUE,
                              numeric.sig.digs = 3,
                              no.plot=FALSE,
                              name=NULL,
                              label=name,
                              description=label,
                              advanced = 0,
                              thumbnail = NULL,
                              service = FALSE,
                              in.menu = !service,
                              paramset.transformer = NULL
                              )  {
  if(is.null(name))  name <- deparse(substitute(handler))
  is(handler, "function") || stop("handler is not a function")

  if(is.null(param.set)) param.set <- default.param.set(handler)

  if(!is.null(paramset.transformer))  {
    is.function(paramset.transformer) || stop("paramset.transformer is not NULL or a function: ",
                                              paste(collapse = " ", is(paramset.transformer)))
    argNames <- names(formals(paramset.transformer))
    length(argNames) %in% 1:2 || stop("paramset.transformer must have 1 or 2 arguments, but it has 0 or more than 2: ",
                                      paste(collapse = " ", argNames))
  }

  
  if(service && in.menu)
    stop("Service Pages cannot appear in menu, but you supplied service = TRUE and in.menu = TRUE")
  
  ap <- list(handler=handler,
             params= param.set,
             annotate.plot=annotate.plot,
             standard.ids=standard.ids,
             class.name=class.name,
             plot.pars.transformer=plot.pars.transformer,
             annotate.data.frame=annotate.data.frame,
             numeric.sig.digs = numeric.sig.digs,
             no.plot=no.plot,
             name=name,
             label=label,
             description=description,
             advanced=advanced,
             service=service,
             in.menu = in.menu,
             paramset.transformer = paramset.transformer)
  ap$thumbnail <- thumbnail  # don't store if NULL
  class(ap) <- "AnalysisPage"

  if(!skip.checks)  {
    svg.file <- tempfile(fileext=".svg")

    ## This will do a lot of checks, possibly croaking along the way
    got <- execute.handler(ap, params=list(), plot.file=svg.file)

    if(is(got, "AnalysisPageResponse"))  {
      ## croak unless this is a valid response ...
      .validate.response(got)
    }  else  {
      ## ... or a valid data structure
      .validate.datanode(got)  ## I don't want to do this check every time---it might be slow.
    }

    unlink(svg.file)
  }
  
  return(ap)  
}


.validate.plot.pars.transformer <- function(ppt)  {
  if(is.null(ppt)) return()  ## NULL is fine
  is.function(ppt) || stop("Expecting plot.pars.transformer to be a function, but I got is(plot.pars.transformer) = ",
                           paste(collapse= " ", is(ppt)))
  all(c("plot", "other") %in% names(formals(ppt))) || stop("Expecting plot.pars.transformer to have arguments 'plot' and 'other', but you gave me the following: ",
                                                            paste(collapse=" ", names(formals(ppt))))
}

.validate.analysis.page <- function(ap)  {
  reqd.names <- c("handler","params","annotate.plot","standard.ids")
  missing.names <- setdiff(reqd.names, names(ap))
  length(missing.names) == 0 || stop("AnalysisPage required names missing: ", paste(collapse=" ", missing.names))

  optional.names <- c("class.name", "plot.pars.transformer",
                      "annotate.data.frame", "numeric.sig.digs",
                      "no.plot",
                      "name", "label", "description",
                      "advanced", "service", "thumbnail",
                      "in.menu",
                      "paramset.transformer")
  extra.names <- setdiff(names(ap), c(reqd.names, optional.names))
  length(extra.names) == 0 || stop("AnalysisPage unexpected names: ", paste(collapse=" ", extra.names))
          
  is(ap$handler, "function") || stop("AnalysisPage $handler is not a function: ", paste(collapse=" ", is(ap$handler)))

  is.logical(ap$annotate.plot) || stop("AnalysisPage $annotate.plot is not a logical: ", paste(collapse=" ", is(ap$annotate.plot)))
  if("class.name" %in% names(ap))  {
    is.character(ap$class.name) || stop("AnalysisPage $class.name is not a character: ", paste(collapse=" ", is(ap$class.name)))
    length(ap$class.name) == 1 || stop("AnalysisPage $class.name must have length 1 if presetn: length=", length(ap$class.name))
  }

  .validate.plot.pars.transformer(ap$plot.pars.transformer)
  
  .validate.paramset(ap$params)
}
  



##' Execute the handler
##'
##' \code{execute.handler} executes the plot function in the handler based on the
##' parameter list, checks that the output is valid, adds the SVG attributes to the plot,
##' and returns an AnnotatedDataFrame.
##'
##' All of the parameters in the parameter list are JSON decoded. Even though this is
##' really just extra work for the scalar parameters, we do it because otherwise it is confusing
##' who needs to be de/encoded and who doesn't.
##'
##' It is OK if your handler doesn't turn off the device when it's done. This wrapper
##' will check if the current device hasn't changed. If so, it will call \code{dev.off}.
##' This is useful because then you can use the same function in an interactive session,
##' and also saves you one line of code. It's also OK if your handler *does* turn off
##' the device. Then the current device will have decreased and the wrapper will
##' known not to call dev.off again.
##'
##' It is also OK if your handler returns a data.frame instead of an AnnotatedDataFrame.
##' It just has to have \code{x}, \code{y}. An AnnotatedDataFrame will be built
##' The interpretation
##' of the fields in the AnnotatedDataFrame depend on your front end, but the guidelines
##' are like this:
##'
##' \describe{
##'   \item{\code{type}}{"text", "numeric" or "none", to set sorting and filtering options.}
##'   \item{\code{labelDescription}}{A display name for the column, instead of showing the actual name.}
##' }
##'
##' If \code{$no.plot} is true then the plotting device won't be opened or closed, and of course the plot won't be annotated.
##'
##' If annotate.data.frame is set then your data.frame is converted to an AnnotatedDataFrame
##' and your AnnotatedDataFrame is converted to an AnalysisPageDataNode of "table" type
##' automatically.
##' 
##' @title execute.handler
##' @param analysis.page AnalysisPage object
##' @param params Named list of parameters. These can include arguments to \code{\link{svg}}
##' and arguments to the handler function. If there are any extra arguments then an
##' error is thrown.
##' @param plot.file Path to file to create. Should not exist already.
##' @param file.params Named list of parameters (but defaults to empty list). These will be
##' passed through as-is and should correspond to FILE uploads (being length-2 lists with
##' \code{$name} and \code{$tmp_name} elements).
##' @param device The plotting device function to use. Default: svg. You might specify
##' png instead (you are passing the actual function here, not its name).
##' @param annotate.plot Logical, indicating whether I should try to annotate the SVG plot.
##' (If you aren't using the SVG device then this should be set to FALSE to not waste
##' time trying to annotate the plot.)
##' Default: \code{analysis.page$annotate.plot}
##' @param max.annotated.regions Integer. If the handler returns more than this
##' many regions then do not try to annotate them in the plot. Default: 5000
##' @param logger log4r object. Default: no logging (FATAL + 1)
##' @return AnnotatedDataFrame, but throws error if the handler is not making a plot, or is
##' returning invalid data.
##' @author Brad Friedman
##' @examples
##' page <- new.analysis.page(AnalysisPageServer:::sine.handler)
##' plot.file <- tempfile(fileext = ".svg")
##' plist <- lapply(list(xmin=-2*pi, xmax=2*pi, n= 50), rjson::toJSON)
##' sine.data <- AnalysisPageServer:::execute.handler(page, plist, plot.file=plot.file)
##' # now sine.data is an AnnotatedDataFrame
##' @seealso \code{\link{new.analysis.page}}
##' @importFrom rjson fromJSON toJSON
##' @importFrom Biobase AnnotatedDataFrame sampleNames sampleNames<- varLabels varMetadata varMetadata<- pData pData<-
##' @importFrom log4r info create.logger
execute.handler <- function(analysis.page, params, plot.file, file.params=list(),
                            device=svg,
                            annotate.plot=analysis.page$annotate.plot,
                            max.annotated.regions = 5000,
                            logger=create.logger(stderr(), log4r:::FATAL+1))  {

  ## reset some of the details from the last request, such as
  ## any messages which were thrown. This used to be called further down but
  ## then it was missing things like messages and also appendCustomContent() calls.
  ## So why not call it at the top here, and catch everything?
  clearRequestEnv()
  
  info(logger, paste("execute.handler()"))
  is(analysis.page, "AnalysisPage") || stop("analysis.page is not an AnalysisPage: ", paste(collapse= " ", is(analysis.page)))


  #### PREPARE PARAMETERS ####
  params <- .prepare.params(params, file.params, device)
  ## Important to log the params before we start screwing with them
  ## because they might not be JSON encodable later, after they've been transformed
  jsonParams <- toJSON(params)
  info(logger, paste("execute.handler(): params", jsonParams))

  ## Don't touch the plot parameters
  pNames <- names(params$other)
  params$other <- lapply(setNames(pNames, pNames), function(pname)  {
    pval <- params$other[[pname]]
    Param <- analysis.page$params[[pname]]
    .transform.param.value(pval, Param)  ### ok if Param is NULL---no transformation
  })
  
  paramset.transformer <- analysis.page$paramset.transformer
  if(!is.null(paramset.transformer))  {
    if(length(formals(paramset.transformer)) == 1)  {
      params$other <- paramset.transformer(params$other)
    }  else  {
      params$other <- paramset.transformer(params$other, analysis.page)
    }
  }

  
  all.handler.params <- names(analysis.page$params)

  extra.params <- setdiff(names(params$other), all.handler.params)
  length(extra.params) == 0 || stop("Extra parameters: ", paste(collapse =" ", extra.params))

  do.plot <- !analysis.page$no.plot

  info(logger, paste("execute.handler(): do.plot", do.plot))
  
  if(do.plot)  {
    ppt <- analysis.page$plot.pars.transformer
    if(!is.null(ppt))  {
      ## catch errors gracefully
      vwc <- tryKeepConditions(ppt(plot=params$plot, other=params$other))
      if(vwc.is.error(vwc))  {
        msg <- paste(sep = "\n",
                     paste(collapse = "\n", vwc.error(vwc)),
                     .errorMsgDelim,
                     "FULL PARAMS:",
                     jsonParams,
                     "ANALYSIS.PAGE STACK TRACE:",
                     paste(collapse = "\n", vwc.error.traceback(vwc)))
        stop(msg)
      }
      params$plot <- vwc.value(vwc)
    }

    info(logger, paste("execute.handler(): params$plot after possible transform", toJSON(params$plot)))
    info(logger, paste("execute.handler(): opening device"))
    
    do.call(device, c(list(filename=plot.file), params$plot))  
    i.dev <- dev.cur()

    ## add an exit hook to close the plotting device---important in case there is an error during handling!
    on.exit(if(dev.cur() == i.dev)  dev.off())
  }



  #### CALL HANDLER ####
  info(logger, paste("execute.handler(): calling analysis.page$handler"))
  
  ## This is the magic...but it still might go wrong so make sure to have a really good error message:
  ## Also we will be ready to extract warning messages
  retval <- tryKeepConditions(do.call(analysis.page$handler, params$other))

  
  if(vwc.is.error(retval))  {
    msg <- paste(sep = "\n",
                 paste(collapse = "\n", vwc.error(retval)),
                 .errorMsgDelim,
                 "PARAMS:",
                 jsonParams,
                 "ANALYSIS.PAGE STACK TRACE:",
                 paste(collapse = "\n", vwc.error.traceback(retval)), "")
    stop(msg)
  }

  info(logger, paste("execute.handler(): analysis.page$handler returned"))

  handler.messages <- vwc.messages(retval)
  .appendMessagesToCustomContent(handler.messages)

  handler.warnings <- vwc.warnings(retval)
  retval <- vwc.value(retval)
  
  ## Caption can be provided by returning a list with
  ## names "caption" and "data", caption being the caption, and
  ## data being (Annotated)dataframe. If that is the case then first
  ## thing is to take away the caption and set retval to the data slot.
  if(!is.data.frame(retval) && !is(retval, "AnnotatedDataFrame")
     && !is(retval, "AnalysisPageDataNode")
     && is(retval, "list")
     && ! analysis.page$service)  {
    known.components <- c("data","caption")
    unknown.comps <- setdiff(names(retval), known.components)
    length(unknown.comps) == 0 || stop("Unknown handler return value components: ",
            paste(collapse = " ", unknown.comps))
    caption <- retval$caption
    retval <- retval$data
  }  else  {
    caption <- ""
  }
     

  ## We can only anontate the plot if there are at least 3 points---otherwise the first two will always match no matter what!
  annotate.plot <- annotate.plot && nrow(retval) > 2 && nrow(retval) <= max.annotated.regions

  
  
  if(do.plot)  {
    if(dev.cur() == i.dev)  dev.off()
    on.exit()  # remove the exit hook---the plotting device is properly closed and we don't need to do it again
    info(logger, paste("execute.handler(): plotting device closed"))
  }
  
  ## clean up and standardize return value and metadata. Also, when no.plot is not set, checks that "x" and "y" were provided.
  if(analysis.page$annotate.data.frame)  {
    info(logger, paste("execute.handler(): annotating data frame"))

    if(analysis.page$no.plot)  {
      retval <- annotate.data.frame(retval, required.fields=character(0), signif.digits = analysis.page$numeric.sig.digs)
    }  else  {
      if(annotate.plot)  {
        ## remember unrounded x and y values so that we can later annotate the plot
        ## The $x/$y notation will work for both data frame and AnnotatedDataFrame
        x <- retval$x
        y <- retval$y
      }
      retval <- annotate.data.frame(retval, signif.digits = analysis.page$numeric.sig.digs)
    }
  }
  
  if(do.plot)  {
    file.exists(plot.file) || stop("No plot was made. Expected '", plot.file, "'. dev.list: ", paste(collapse=", ", names(dev.list()), dev.list()))

    if(annotate.plot && nrow(retval) > 2)  {
      info(logger, paste("execute.handler(): annotating plot"))
      
      apsi <- analysis.page$standard.ids
      if((is.logical(apsi) && apsi) || is.function(apsi))  {
        msi <- if(is.function(apsi))  apsi  else make.standard.ids
        try(sampleNames(retval) <- msi(nrow(retval)))
      }
      id <- sampleNames(retval)  ## these are not necessarily samples---they are just the rownames. But this is the interface for AnnotatedDataFrame
      
      attr <- lapply(1:nrow(retval), function(i) c(class=analysis.page$class.name, id=id[i]))
      
      ## There might be problems annotating the plot. This should typically only happen if there are 2 or fewer points,
      ## but there are other pathological examples. The front end should handle not finding any points gracefully.
      ## Is there some useful way to communicate that there was a problem, aside from not actually annotating anything?
      ## Note: x and y come from the if(analysis.page$annotate.data.frame) block above.
      try(annotate.analysis.page.svg(plot.file,
                                     x = x, y = y,
                                     ids = id,
                                     verbose = log4r::level(logger) < log4r:::INFO),
          silent=TRUE)
    }

    info(logger, paste("execute.handler(): building plot datanode"))

    ## we're done with x and y---hide them from the user.
    try(retval <- retval[, ! varLabels(retval) %in% c("x", "y")],
        silent = TRUE)
    
    retval <- new.datanode.plot("plot",
                                plot.file = basename(plot.file),
                                table = new.datanode.table("table", retval, caption = caption),
                                warnings = handler.warnings,
                                filter.widget = getFilterWidget(),
                                custom = getCustomContent())
  }  else  {
    if(analysis.page$annotate.data.frame && !is(retval, "AnalysisPageDataNode"))  {
      info(logger, paste("execute.handler(): building table datanode"))
          
      retval <- new.datanode.table("table",
                                   retval,
                                   caption = caption,
                                   warnings = handler.warnings,
                                   custom = getCustomContent())
    }
  }

  info(logger, paste("execute.handler(): returning"))
  
  return(retval)
}





##' Clean up and annotate a data frame
##'
##' The obj argument should be a return value from a handler, either a data.frame or an
##' annotated data.frame. If a data.frame then an AnnotatedDataFrame is built. Then
##' three special fields in \code{varMetadata} are checked: "labelDescription" and "type"
##'
##' If any is missing then they are built as follows:
##' \describe{
##'   \item{labelDescription}{labelDescription always exists, but sometimes it has NA entries.
##' In those cases it is set to the name of the variable (rowname of the \code{varMetadata}).
##' This is the one that you most likely might want to set yourself.}
##'   \item{type}{If not present, then it is calculated from the pData like this:
##'      \code{sapply(lapply(pData(obj), is), "[", 1)}. This will become one of "integer", "factor",
##'      "logical", "numeric" or "character", and the front end should know how to render these.}
##' }
##'
##' Columns that have type "numeric" (but not "integer") are rounded to
##' the given number of significant digits.
##' 
##' Also, this throws an error if "x" or "y" field is missing
##' @title annotate.data.frame
##' @param obj data.frame or AnnotatedDataFrame: the return value of a handler.
##' @param required.fields Character vector of required fields. Default: \code{c("x","y")}. You could set to \code{character(0)}, for
##' example, if you don't want to force a check that "x" and "y" be present.
##' @param signif.digits Integer, default 3, giving the number of significant digits
##' to which "numeric" (but not "integer") columns should be rounded, using
##' \code{signif()}. NULL means to not round at all.
##' @return AnnotatedDataFrame
##' @author Brad Friedman
annotate.data.frame <- function(obj, required.fields=c("x","y"), signif.digits=3)  {
  if(is.data.frame(obj))
    obj <- as(obj, "AnnotatedDataFrame")

  if(!is(obj, "AnnotatedDataFrame"))  stop("Return value was not a data.frame or an AnnotatedDataFrame: ", paste(collapse = " ", is(obj)))  

  missing.fields <- setdiff(required.fields, varLabels(obj))
  
  length(missing.fields) == 0 || stop("Missing expected field(s) from return value: ", paste(collapse=" ", missing.fields))
  
  ## Assign "type" fields if not already present
  if(! "type" %in% names(varMetadata(obj)))
    varMetadata(obj)$type <- sapply(lapply(pData(obj), is), "[", 1)

  if(!is.null(signif.digits))  {
    to.round <- varMetadata(obj)$type == "numeric"
    to.round[is.na(to.round)] <- FALSE
    ## just in case some says they have a "numeric" type but really
    ## supply something else, we have to just skip rounding that
    ## something else, because it would crash
    to.round <- to.round & sapply(pData(obj), is.numeric)
    pData(obj)[to.round] <- signif(pData(obj)[to.round], signif.digits)
  }

  vmdld <-   varMetadata(obj)$labelDescription
  varMetadata(obj)$labelDescription <- ifelse(is.na(vmdld), varLabels(obj), vmdld)

  return(obj)
}


.fileIdAttribute <- "___APS_fileContentId___"


## File parameters appear in the main parameter as list(fileContentId = fileId)
## This has to be replaced with list(name =, tmp_name =, fh =), as described
## in file.param doc. These are taken from the file.params list.
##
## The list(fileContentId = fileId) can potentially appear anywhere within the params
## structure, so we traverse the whole thing recursively, and replace them where
## they are found.
##
## The return value is a length 2 list. First entry is the params structure,
## with file params injected. Second entry is whatever remains of the file.params
## list.
.inject.file.params <- function(params, file.params,
                                debug = FALSE)  {

  if(debug)  {
    message("IFP:")
    str(list(params, FP = file.params))
  }
            
  ## this prevents messing up vectors
  if(!is.list(params))  {
    if(debug)
      message("params not a list")
    return(list(params, file.params))
  }
  
  injected <- lapply(params, function(par)  {
    if(debug)  {
      message("  par")
      str(list(par, FP = file.params))
    }
    
    if(is.list(par) &&
       length(par) == 1 &&
       !is.null(names(par)) &&
       names(par) == .fileIdAttribute)  {
      fileId <- par[[.fileIdAttribute]]
      if(fileId %in% names(file.params))  {
        if(debug)
          message("  par is a file param---swapping out file info")
        
        ## This is a file param---Swap out the file info
        fp <- file.params[[fileId]]
        file.params[[fileId]] <<- NULL  ## delete this from file.params
        return(fp)
      }
    }

    ## otherwise recurse
    if(debug)
      message("  par not a file param---recursing")

    got <- .inject.file.params(par, file.params, debug = debug)
    file.params <<- got[[2]]
    return(got[[1]])
  })

  if(debug)  {
    message("IFP done, returning")
    str(list(injected, FP = file.params))
  }
  
  return(list(injected, file.params))
}


## Prepare parameter list for opening graphics device and calling handler
##
## NULL parameters are removed; GET and POST parameters are JSON converted and merged with FILES (which are left as-is, not JSON converted), and SVG parameters are separated from others.
##   params: List of parameters (already URI unescaped, but still JSON encoded).
## return List with \code{$svg} and \code{$other} elements, each being a named list of JSON-decoded parameter values.
.prepare.params <- function(params, file.params=list(), device=svg)  {
  is.list(params) || stop("params is not a list: ", paste(collapse= " ", is(params)))
  
  ## file uploads get put into both POST and FILES. Take them out of hte general params, which are going ot be
  ## JSON-decoded, and just keep them in FILES.
  params <- params[! names(params) %in% names(file.params)]

  params <- lapply(params, function(p)  tryCatch(fromJSON(p),
                                                 error=function(e) stop("While JSON decoding parameter value '", p,
                                                   "': ", e$message)))

  ## Now inject the file structures into the parameters
  injected <- .inject.file.params(params, file.params)
  params <- injected[[1]]
  file.params <- injected[[2]]
  params <- c(params, file.params)  ## attach any remaining file params

  ## don't allow specifying of plot filename through params list
  all.plot.params <- setdiff(names(formals(device)), "filename")

  
  plot.params <- params[intersect(names(params), all.plot.params)]

  other.params <- params[setdiff(names(params), all.plot.params)]

  list(plot=plot.params,
       other=other.params)
}





##' Make a vector of standardized IDs
##'
##' Make a vector of standardized IDs.
##' @title make.standard.ids
##' @param n Desired length of vector
##' @param prefix String, default "Reg".
##' @return Character vector. Currently just "Reg1", "Reg2", ..., "Regn" (or starting with whatever prefix is).
##' @author Brad Friedman - Regular
make.standard.ids <- function(n, prefix = "Reg")  {
  paste(sep="", prefix, 1:n)
}


## From here on down are toy examples for testing and development purposes

##' An example handler just for testing and development
##'
##' This handler takes three parameters, xmin, xmax and n,
##' makes a plot of the sin curve from xmin to xmax (using
##' n equally spaced points), and returns a data.frame
##' with the x and y coordinates, with IDs A-Z, A.1-Z.1, ...
##'
##' @title sine.handler
##' @param xmin Numeric. Minimum x value to plot
##' @param xmax Numeric. Maximum x value to plot
##' @param n Integer. Number of points to plot
##' @return data.frame
##' @author Brad Friedman
sine.handler <- function(xmin=0, xmax=3*pi, n=100)  {
  xmin <- as.numeric(xmin)
  xmax <- as.numeric(xmax)
  n <- as.numeric(n)
  x <- seq(xmin, xmax, length=n)
  y <- sin(x)
  plot(x,y, pch=19, col="seagreen")
  
  ids <- make.unique(rep(LETTERS, length=n))
  return(data.frame(x=x, y=y, row.names = ids))
}

## same thing, but plot the cosine instead
cosine.handler <- function(xmin=-pi, xmax=pi, n=50)  {
  xmin <- as.numeric(xmin)
  xmax <- as.numeric(xmax)
  n <- as.numeric(n)
  x <- seq(xmin, xmax, length=n)
  y <- cos(x)
  plot(x,y, pch=19, col="seagreen")
  
  ids <- make.unique(rep(LETTERS, length=n))
  return(data.frame(x=x, y=y, row.names = ids))
}





dataonly.handler <- function()  {
  candidates <- new.datanode.array("bar", list(new.datanode.simple("mitt", value="romney"),
                                                 new.datanode.simple("obama", value=1)))
  new.datanode.array("dataonly", list(new.datanode.simple("foo", 1),
                                      candidates))
}

dataonly.analysis.page <- function()  {
  new.analysis.page(dataonly.handler,
                    annotate.data.frame=FALSE,
                    no.plot=TRUE)
}

dataframeonly.handler <- function()  {
  data.frame(vInteger=1:5, vCharacter=LETTERS[1:5], vLogical=rep(c(TRUE, FALSE), len=5),
             vNumeric=1:5+0.1, vFactor=rep(factor(letters[1:3]), len=5),
             stringsAsFactors=FALSE)
}

dataframeonly.analysis.page <- function() {
  ## this one will be passed through annotate.data.frame
  new.analysis.page(dataframeonly.handler,
                    no.plot=TRUE)
}
  

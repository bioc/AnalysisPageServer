## This file contains function to help build custom HTML that embeds AnalysisPageServer elements

##' Default stylesheets for HTML headers
##'
##' Default stylesheets for HTML headers
##' @title default.stylesheets
##' @return character vector
##' @author Brad Friedman
default.stylesheets <- function()  {
  "css/concatenated.css"
}

##' Generate HTML for custom headers to load AnalysisPageServer CSS and viewport
##'
##' Generate HTML for custom headers to load AnalysisPageServer CSS and viewport.
##' To be honest I don't understand how all this works. The main thing is that it you put this stuff
##' up top, in the header section. The only argument you should consider touching is \code{libbase.prefix},
##' if you are going to put your common libraries in a shared area instead making a copy next to each
##' dataset.
##' @title custom.html.headers
##' @param libbase.prefix Prefix where your shared CSS files will be located. Default: \code{get.APS.libbase.prefix().
##' @param viewport Default: "width=device-width, initial-scale=1.0". This will be used in a \code{<meta name="viewport">} tag.
##' @param stylesheets Charvec of stylesheets to load. Default is \code{default.stylesheets()}.
##' @param ep.svg.styles ep-svg-styles stylesheet. Default: "css/svg.css".
##' @return HTML string to be included in \code{<head>} section.
##' @author Brad Friedman
##' @export
custom.html.headers <- function(libbase.prefix = get.APS.libbase.prefix(),
                                viewport = "width=device-width, initial-scale=1.0",
                                stylesheets = default.stylesheets(),
                                ep.svg.styles = "css/svg.css")  {

  meta.viewport <- paste0('<meta name="viewport" content="', viewport, '">')
  
  stylesheets.html <- paste0('<link href="', libbase.prefix, stylesheets, '" rel="stylesheet" type="text/css" />')
  if(!is.null(ep.svg.styles)) {
    stylesheets.html <- c(stylesheets.html,
                          paste0('<link id="ep-svg-styles" href="', libbase.prefix, ep.svg.styles, '" type="text/css" rel="stylesheet">'))
  }

  
  main.script <- paste0('<script id="ep-entry-script" data-main="',
                        libbase.prefix, 'js/requirejs-webconfig" src="',
                        libbase.prefix, 'js/require.js"></script>')
                        
  return(paste(c(meta.viewport, stylesheets.html, main.script), collapse= "\n"))
                                                                    
}


##' Create HTML for a div element to contain one AnalysisPageServer data set
##'
##' Create HTML for a div element to contain one AnalysisPageServer data set.
##' This function does not created, modify, or even check for existance of
##' the SVG and JSON files. You provide paths and this function just includes
##' those paths, however awful, in the HTML returned.
##' @title aps.one.dataset.div
##' @param svg.path Path (could be relative to index.html) to (annotated) SVG file. NULL
##' to only have data table and no picture.
##' @param data.path Path (could be relative to index.html) to JSON file containing data set.
##' NULL to only have SVG and no table
##' @param show.sidebar Boolean. If TRUE (default) then show sidebar. If FALSE then omit it.
##' @param show.table Boolean. If TRUE (default) then show sidebar. If FALSE then omit it.
##' @param num.table.rows Number of table rows to show. Default: 10
##' @param extra.html.class Thesee are extra classes to add to the div. This could be used for
##' whatever extended purpose you want, like extra styling or logic. Should be an unnamed charvec.
##' Default is \code{character()}, just use the basic required for APS.
##' @param extra.div.attr These are extra attributes to add to the div. For example you could
##' add an \code{id} attribute. It should be a named charvec, or NULL (default) to not anything
##' extra beyond that required for APS.
##' @return HTML string
##' @author Brad Friedman
##' @seealso \code{\link{aps.dataset.divs}}, a convenience wrapper for this
##' function to create multple divs at once.
##' @export
aps.one.dataset.div <- function(svg.path = NULL,
                                data.path = NULL,
                                show.sidebar = TRUE,
                                show.table = TRUE,
                                num.table.rows = 10,
                                extra.html.class = character(),
                                extra.div.attr = NULL)  {
  basic.html.class <- c("ep-analysis-page-data-set","container-fluid")
  class.string <- paste(collapse= " ", c(basic.html.class, extra.html.class))

  length(extra.div.attr) == 0 || (is.character(extra.div.attr) && is.vector(extra.div.attr) && !is.null(names(extra.div.attr))) || stop("extra.div.attr must be NULL or a named charvec")

  stopifnot(!is.null(svg.path) || !is.null(data.path))
  if(is.null(data.path)) show.table <- FALSE
  
  div.attr <- c(class = class.string,
                `data-sidebar-visible` = if(show.sidebar) "yes" else "no",
                `data-table-visible` = if(show.table) "yes" else "no",
                extra.div.attr)
  if(show.table)
    div.attr["data-table-rows"] <- as.character(num.table.rows)
  
  if(!is.null(svg.path))
     div.attr["data-svg"] <- svg.path
  if(!is.null(data.path))
    div.attr["data-set"] <- data.path

  quoted.div.attr <- paste0("\"", div.attr, "\"")

  div.attr.str <- paste(names(div.attr), quoted.div.attr, sep = "=", collapse= "\n  ")
  div.html <- paste0("<div ", div.attr.str, "></div>")

  return(div.html)
  
}

##' Generate HTML for multiple DIV elements corresponding to a paths list
##'
##' This function is meant to work with the return value of \code{\link{static.analysis.page}}
##' That function returns an object with a \code{$paths.list} element which
##' contains the relative paths to each of the plots and datasets. You pass that
##' through as the first argument to this function and it will make divs corresponding
##' to those plots. The other arguments are either vectors or lists of corresponding
##' lengths to pass through to \code{\link{aps.one.dataset.div}}.
##' @title aps.dataset.divs
##' @param paths.list List of lists. The outer list corresponds to data sets
##' and the inner lists have names in \code{$plot} and \code{$data}, giving
##' relative paths to the SVG and JSON files (OK to omit one). Or a list
##' with a \code{$paths.list} element, which would be used (this lets you
##' pass the return value of \code{static.analysis.page} directly to this function).
##' @param show.sidebar Logical vector of same length as \code{paths.list} to
##' pass through corresponding elements to \code{\link{aps.one.dataset.div}}.
##' Default: all TRUE.
##' @param show.table Logical vector of same length as \code{paths.list} to
##' pass through corresponding elements to \code{\link{aps.one.dataset.div}}.
##' Default: all TRUE.
##' @param num.table.rows Number of table rows to show. Default: 10.
##' Recycled to \code{length(paths.list)}.
##' @param extra.html.class List (of charvecs) of same length as \code{paths.list} to
##' pass through corresponding elements to \code{\link{aps.one.dataset.div}}.
##' Default: All empty charvec.
##' @param extra.div.attr List (of named charvecs or NULLs) of same length as \code{paths.list} to
##' pass through corresponding elements to \code{\link{aps.one.dataset.div}}.
##' Default: all NULL.
##' @return Charvec of HTML divs corresponding to datasets in \code{paths.list}.
##' @author Brad Friedman
##' @export
aps.dataset.divs <- function(paths.list,
                             show.sidebar = rep(TRUE, length(paths.list)),
                             show.table = rep(TRUE, length(paths.list)),
                             num.table.rows = 10,
                             extra.html.class = rep(list(character()), length(paths.list)),
                             extra.div.attr = rep(list(NULL), length(paths.list)))  {
  stopifnot(is.list(paths.list))
  if("paths.list" %in% names(paths.list))
    paths.list <- paths.list$paths.list
  stopifnot(names(unlist(paths.list)) %in% c("plot", "data"))
  n.ds <- length(paths.list)
  stopifnot(is.logical(show.sidebar))
  stopifnot(is.logical(show.table))
  show.sidebar <- rep(show.sidebar, length = n.ds)
  show.table <- rep(show.table, length = n.ds)
  stopifnot(is.list(extra.html.class))
  stopifnot(is.list(extra.div.attr))
  extra.html.class <- rep(extra.html.class, length = n.ds)
  extra.div.attr <- rep(extra.div.attr, length = n.ds)
  num.table.rows <- rep(num.table.rows, length = n.ds)

  divs <- sapply(1:n.ds, function(i.ds)  {
    aps.one.dataset.div(svg.path = paths.list[[i.ds]]$plot,
                        data.path = paths.list[[i.ds]]$data,
                        show.sidebar = show.sidebar[i.ds],
                        show.table = show.table[i.ds],
                        num.table.rows = num.table.rows[i.ds],
                        extra.html.class = extra.html.class[[i.ds]],
                        extra.div.attr = extra.div.attr[[i.ds]])
  })

  return(divs)
}

##' Return custom attributes required for body element
##'
##' This attribute must be included in the <body> element.
##' @title custom.body.attr
##' @return Name charvec of attributes for body
##' @author Brad Friedman
##' @export 
custom.body.attr <- function()  {
  c(`data-env` = "analysis-page-server")
        
}

##' Generate a <body> HTML line including attributes for APS
##'
##' Generate a <body> HTML line including attributes for APS.
##' Your <body> element must have the special attribute returned by
##' the \code{\link{custom.body.attr}()}. This function
##' makes a line of HTML code containing that, and any other
##' attributes you want to include. It just opens the
##' <body> element, but does not close it.
##' @title custom.body.html
##' @param extra.attr Other attributes, provided in a named charvec.
##' @return One line of HTML with a <body> element opening tag.
##' @author Brad Friedman
##' @export
custom.body.html <- function(extra.attr = NULL)  {
  attr <- c(custom.body.attr(), extra.attr)
  quoted.attr <- paste0("\"", attr, "\"")
  
  attr.str <- paste(names(attr), quoted.attr, sep = "=", collapse= "\n  ")
  html <- paste0("<body ", attr.str, ">")
  return(html)
  
}

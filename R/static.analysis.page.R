## x is a charvec. I return a logical vector indicating the entry is a valid HTML4 ID:
## begin with a letter ([A-Za-z]), then followed by any number of letters,
## digits ([0-9]), hyphens ("-"), underscores ("_"), colons (":"), and periods (".").
## (Taken from http://www.w3.org/TR/html4/types.html#h-6.2)
.valid.html4.id.regex <- "^[A-Za-z][A-Za-z0-9\\-_:\\.]*$"
.valid.html4.ids <- function(x)  {
  ## perl = T makes the \- work in the regex. I don't know how else you are supposed to do this!
  grepl(.valid.html4.id.regex, x, perl = TRUE)
}

.dataset.offset <- list2env(list(offset = 0))

.next.dataset.offset <- function()  {
  .dataset.offset$offset <- .dataset.offset$offset + 1
  return(.dataset.offset$offset)
}

.set.dataset.offset <- function(offset)  {
  .dataset.offset$offset <- offset
}


##' Create interactive AnalysisPage plots from static data
##'
##' Create interactive AnalysisPage plots from static data.
##' An index.html file will be created which, when opened, will have
##' all the data and interactivity.
##'
##' Also in that subdirectory there will be other HTML and Javascript
##' files as necessary.
##'
##' Finally, your SVGs and data will be stored in subdirectories.
##'
##' The first two columns of the data frame should be x and y coordinates
##' of the points (or regions) in the plot that you want to associate
##' with the rows of the data frame.
##'
##' @title static.analysis.page
##' @param outdir Base directory for output files. Will be created if it
##' does not already exist (however, its parent directory must already exist).
##' @param svg.files Character vector of paths to SVG files. NAs can be used
##' as placeholders for datasets that have data but no plot. Length must be
##' at least 1. If omitted then all NAs are used, something
##' like \code{rep(NA, length(dfs))}, but a bit more careful about corner
##' cases and types. (So you have to provide at least one of \code{svg.files}
##' and \code{dfs}).
##' @param dfs List of data frames of the same length as \code{svg.files} or,
##' if \code{length(svg.files) == 1}, a single \code{data.frame}.
##' NULLs can be used as placeholders for datasets that have plot but no data,
##' but an error is thrown if the corresponding entry in \code{svg.files} is
##' also NA. If omitted then all NULLss are used. (So you have to provide at least one of \code{svg.files}
##' and \code{dfs}). Note that for \code{dfs} we use NULLs since it is a list
##' but for \code{svg.files} we use NAs since it is a vector and you can't hold
##' a place in a vector with NULL.
##' @param titles A character vector of titles of the same length as \code{svg.files}
##' to display above each plot. Default is
##' \code{rep("", length(svg.files))}.
##' @param show.xy Logical. If FALSE (default) then the first two columns of your
##' data (the x and y coordinates) are used to annotate the plot but not actually
##' exposed to the user in the table or on rollover. If TRUE then they are exposed.
##' Recycled to \code{length(svg.files)}.
##' @param use.rownames.for.ids Logical, default FALSE. The default behavior is
##' to generate and assign unique IDs to each point. This makes it impossible
##' to tag two elements in the same plot, or even in different plots with the same ID.
##' If you set this to TRUE then your rownames are used. This means that if you
##' are not careful you might accidentally couple between multiple datasets on the page!
##' Recycled to length of \code{svg.files}, so you can set it for each data set independently
##' if you so choose.
##' @param check.rowname.case Logical, default TRUE. For data frames with
##' \code{use.rownames.for.ids} TRUE a check is made that there are not two
##' rownames that are equal without case senstitivity but not with (such as "FirstRow"
##' and "firstrow"). If any is found then an error is thrown.
##' This could possibly be a problem with some browsers, which might treat them the
##' same. FALSE means to skip this check.
##' @param check.html4.ids Logical, default TRUE. For data frames with
##' \code{use.rownames.for.ids} TRUE a check is made that rownames are valid HTML4
##' IDs: begin with a letter ([A-Za-z]), then followed by any number of letters,
##' digits ([0-9]), hyphens ("-"), underscores ("_"), colons (":"), and periods (".").
##' (Taken from http://www.w3.org/TR/html4/types.html#h-6.2) FALSE means to skip
##' this check and try to use whatever IDs are there.
##' @param group.length.vecs List of integer vectors or NULLs of the same length
##' as \code{svg.files} (or a single vector or NULL if \code{length(svg.files) == 1}).
##' If non-NULL, each one is passed through to \code{\link{annotate.analysis.page.svg}}
##' as the \code{group.lengths} argument, which allows you to specify that the elements
##' might be organized into multiple non-contiguous groups, for example separate panels.
##' A single NULL is recycled to length.
##' @param signif.digits Passed through to \code{\link{annotate.data.frame}}.
##' The number of significant digits to which non-integer numeric fields should
##' be rounded.
##' @param verbose Boolean, default FALSE. If TRUE then \code{message()} will be
##' used for progress updates.
##' @param overwrite If FALSE (default) then an error is thrown if the base directory
##' is not empty. If TRUE then files will be added to the directory,
##' possibly overwriting existing files of the same name.
##' @param write.client Boolean, default TRUE. Should I write the HTML/Javascript/CSS
##' files necessary for the client, or just write the data files. The default is to
##' write everything necessary. Use FALSE if you want to have only a single instance of
##' the client files and only write data and plots with this function.
##' @param client.basedir Path to client files. Default: \code{system.file("htdocs/client/dist-apss", package = "AnalysisPageServer")}.
##' Probably should not be modified except during development work on the client.
##' @param app.html Path to application \code{.html} file, relative to \code{client.basedir}.
##' Default: "analysis-page-server-static.html".
##' @param build.full.url Boolean, default is the same as \code{write.client}. For the return
##' value build a full
##' URL starting with "file://", using the full (normalized) path to output directory
##' and index.html, then the full query string. If FALSE then just return the query string.
##' @param data.subdir Subdirectory of \code{outdir} which will hold the data files.
##' Special value of "." means to put them in \code{outdir} itself and not create a subdirectory.
##' Default: "data" if \code{write.client} is TRUE and "." if it is FALSE.
##' @param randomize.filename Boolean, default FALSE. Should I add some random characters
##' to the names of the plot and dataset files? Sometimes web browsers do not refresh these
##' files properly and so adding these random characters can overcome these stubborn cache issues.
##' @inheritParams annotate.data.frame
##' @return List with two components. First is \code{$URL}, which is
##' the URL to index.html file, or, if \code{build.full.url = FALSE} then just the query string.
##' and second is \code{$paths.list}, which lists the paths to all of the written plot and data
##' files, in the format described in \code{link{static.analysis.page.query.string}} (and
##' suitable for passing to that function as the parameter of the same name).
##' @author Brad Friedman
##' @export
##' @examples
##' message("See vignette StaticContent.html")
static.analysis.page <- function(outdir,
                                 svg.files,
                                 dfs,
                                 titles,
                                 show.xy = FALSE,
                                 use.rownames.for.ids = FALSE,
                                 check.rowname.case = TRUE,
                                 check.html4.ids = TRUE,
                                 group.length.vecs = NULL,
                                 signif.digits = 3,
                                 verbose = FALSE,
                                 overwrite = FALSE,
                                 write.client = TRUE,
                                 client.basedir = system.file("htdocs/client/dist-apss", package = "AnalysisPageServer"),
                                 app.html = "analysis-page-server-static.html",
                                 build.full.url = write.client,
                                 data.subdir = if(write.client) "data" else ".",
                                 randomize.filename = FALSE)  {

  ## check if a singleton data frame was sent
  if(is.data.frame(dfs) || is(dfs, "AnnotatedDataFrame"))
    dfs <- list(dfs)

  if(missing(svg.files))
    svg.files <- rep(NA_character_, length(dfs))

  n.ds <- length(svg.files)

  ## check if a singleon group.length.vecs was sent (including the default)
  if(!is.list(group.length.vecs))  {
    if(is.null(group.length.vecs))  {
      group.length.vecs <- rep(list(NULL), n.ds)
    }  else  {
      group.length.vecs <- list(group.length.vecs)
    }
  }

  if(missing(dfs))
    dfs <- rep(list(NULL), length(svg.files))

  if(missing(titles))
    titles <- rep("", n.ds)
  
  ## Argument checking
  stopifnot(length(svg.files) > 0)
  stopifnot(is.vector(svg.files))
  stopifnot(is.character(svg.files) | is.na(svg.files))
  missing.files <- Filter(function(x) !is.na(x) && !file.exists(x), svg.files)
  length(missing.files) == 0 || stop("SVG paths do not exist: ",
          paste(collapse=" ", missing.files))
  (is.vector(use.rownames.for.ids) && is.logical(use.rownames.for.ids)) || stop("use.rownames.for.ids is not a logical vector: ",
                                                                                paste(is(use.rownames.for.ids), collapse = " "))
  
  ## number of data sets
  n.df <- length(dfs)
  n.ds == n.df || stop("length(dfs) == ", n.df, " does not match length(svg.files) == ", n.ds)
  n.titles <- length(titles)
  n.titles == n.ds || stop("length(titles) == ", n.titles, " does not match length(svg.files) == ", n.ds)
  n.glv <- length(group.length.vecs)
  n.glv == n.ds || stop("length(group.length.vecs) == ", n.glv, " does not match length(svg.files) == ", n.ds)
  
  is.character(titles) && is.vector(titles) || stop("titles is not a character vector: ", paste(collapse=" ", is(titles)))

  use.rownames.for.ids <- rep(use.rownames.for.ids, length = n.ds)

  for(i in 1:n.ds)  {
    df <- dfs[[i]]
    is.null(df) || is.data.frame(df) || is(df, "AnnotatedDataFrame") || stop("dfs[[", i,"]] is neither NULL nor a data frame nor an AnnotatedDataFrame: ",
                                                                             paste(collapse=" ", is(df)))

    is.null(df) && is.na(svg.files[i]) && stop("data set ", i, " has NA for plot and NULL for data")

    glv <- group.length.vecs[[i]]
    if(!is.null(glv))  {
      is.null(df) && stop("data set ", i, " has group.length.vec but no data set")
      is.na(svg.files[i]) && stop("data set ", i, " has group.length.vec but no plot")
      
      is.numeric(glv) && is.vector(glv) || stop("group.length.vecs[[", i,"]] is neither NULL nor a numeric vector: ",
                                                paste(collapse=" ", is(glv)))
      sum(glv) == nrow(df) || stop("sum(group.length.vecs[[i]]) == ", sum(glv), " but it should be the same as nrow(dfs[[i]]) == ", nrow(df))
    }

    if(use.rownames.for.ids[i])  {
      is.null(df) && stop("data set ", i ," has use.rownames.for.ids set but no data set")
      rns <- rownames(df)
      ## I think this next line is unreachable but not sure
      stopifnot(is.vector(rns) && is.character(rns) && length(rns) == nrow(df))

      if(check.html4.ids)  {
        invalid.ids <- ! .valid.html4.ids(rns)
        sum(invalid.ids) == 0 || stop("Invalid HTML4 IDs in data set ", i, ": ", paste(collapse = " ", shQuote(rns[invalid.ids])))
      }
    }
    
  }

  if(check.rowname.case)  {
    rns <- lapply(dfs[use.rownames.for.ids], rownames)
    if(length(rns) > 0)  {
      rns <- unlist(rns)
      unique.rns <- unique(rns)
      uc.rns <- toupper(unique.rns)
      non.consistent.rownames.uc <- names(which(table(uc.rns) > 1))
      non.consistent.rownames <- unique.rns[uc.rns %in% non.consistent.rownames.uc]
      
      length(non.consistent.rownames) == 0 || stop("Case-inconsistent rownames: ", paste(collapse= " ", non.consistent.rownames))
    }
  }

  ## Now work with output directory
  if(file.exists(outdir))  {
    isTRUE(file.info(outdir)$isdir) || stop("outdir '", outdir, "' is not a directory")
    
    ## check if it is empty
    if(length(dir(outdir)) > 0)  {
      ## It is not empty
      if(overwrite)  {
        if(verbose)
          message("outdir '", outdir, "' is not empty but overwrite=TRUE so I am going to continue, maybe overwriting contents")
      }  else  {
        stop("outdir '", outdir, "' is not empty. Either clear it out, use a different outdir, or provide overwrite = TRUE")
      }
    }
  }  else  {
    ## outdir does not yet exist
    parent.dir <- dirname(outdir)
    file.exists(parent.dir) || stop("outdir '", outdir, "' does not yet exist so I trying to create it but its parent directory doesn't exist either")

    dir.create(outdir) || stop("Couldn't create outdir '", outdir, "'")
  }

  relpaths <- .write.plots.and.data.for.static.analysis.page(outdir = outdir,
                                                             svg.files = svg.files,
                                                             dfs = dfs,
                                                             titles = titles,
                                                             signif.digits = signif.digits,
                                                             show.xy = rep(show.xy, length = n.ds),
                                                             use.rownames.for.ids = use.rownames.for.ids,
                                                             group.length.vecs = group.length.vecs,
                                                             verbose = verbose,
                                                             data.subdir = data.subdir,
                                                             randomize.filename = randomize.filename)

  if(write.client)
    copy.front.end(outdir = outdir,
                   client.basedir = client.basedir)

  query.string <- static.analysis.page.query.string(relpaths)

  url <- if(build.full.url)  {
    paste(sep = "",
          if(platformIsWindows()) "file:///" else "file://",
          normalizePath(file.path(outdir, app.html)),
          query.string)
  }  else  {
    query.string
  }

  retval <- list(URL = url,
                 paths.list = relpaths)

  return(retval)
                                                     
}

## Return data structure which is a list whose elements correspond to
## the datasets and values are lists with names $plot and $data, being
## paths relative to outdir for the .svg and .json files written (up to
## one can be missing).
.write.plots.and.data.for.static.analysis.page <- function(outdir,
                                                           svg.files,
                                                           dfs,
                                                           titles,
                                                           signif.digits,
                                                           show.xy,
                                                           use.rownames.for.ids = use.rownames.for.ids,
                                                           group.length.vecs = group.length.vecs,
                                                           verbose,
                                                           data.subdir = "data",
                                                           randomize.filename = FALSE)  {
  ## Now annotate and save the plots and format the data. IT will be saved in a "data" subdirectory
  if(data.subdir == ".")  {
    data.dir <- outdir
  }  else  {
    data.dir <- file.path(outdir, data.subdir)
    if(file.exists(data.dir))  {
      file.info(data.dir)$isdir || stop("data.dir '", data.dir, "' exists but is not a directory")
    }  else  {
      dir.create(data.dir)
    }
  }
  n.ds <- length(svg.files)

  ## Unique words to use in identifiers for each SVG file so there are no conflicts.
  words <- unique.words(n.ds)
  relpaths <- list()
  
  for(i in 1:n.ds)  {
    relpaths[[i]] <- list()
    word <- words[i]
    svg.file <- svg.files[i]
    df <- dfs[[i]]

    if(is.null(df))  {
      if(verbose)
        message("No data")
      adf <- AnnotatedDataFrame()  ## empty data
    }  else  {
      if(verbose)
        message("Yes data")
        
      adf <- annotate.data.frame(df, required.fields = character(0), signif.digits = signif.digits)
    }


    i.dataset <- .next.dataset.offset()
    
    outfile.prefix <- paste0("dataset-", i.dataset)

    ## This is a convenience---sometimes web clients will have some deep cache that
    ## makes it keep loading older versions of a plot when doing a lot of iterations.
    if(randomize.filename)
      outfile.prefix <- paste0(outfile.prefix, "-", word)
    
    if(is.na(svg.file))  {
      ## data only
      data.node <- new.datanode.table(name = "table",
                                      data = adf,
                                      caption = titles[i])
    }  else  {
      plot.file.name <- paste0("dataset-", i.dataset, ".svg")
      plot.file.name <- paste(sep=".", outfile.prefix, "svg")
      relpaths[[i]]$plot <- plot.file.relpath <- file.path(data.subdir, plot.file.name)
      plot.file.fullpath <- file.path(outdir, plot.file.relpath)

      
      if(verbose)
        message("Writing plot file ", plot.file.fullpath)
      file.copy(svg.file, plot.file.fullpath)

      ## nrow(df) has to be > 2 because I need 3 points to calculate correlations,
      ## which is how the plot objects are found.
      ## ncol(df) >= 2 because I need x and y coordinates
      if(nrow(adf) > 2 && ncol(adf) >= 2)  {
        ## Try to annotate the plot
        try({
          if(use.rownames.for.ids[i])  {
            ids <- sampleNames(adf)
          }  else  {
            sampleNames(adf) <- ids <- make.standard.ids(nrow(adf), prefix = paste(sep="_", "Reg", word, ""))
          }
          group.lengths <- group.length.vecs[[i]]
          if(is.null(group.lengths))
            group.lengths <- nrow(adf)
          
          annotate.analysis.page.svg(plot.file.fullpath,
                                     x = adf[[1]],
                                     y = adf[[2]],
                                     ids = ids,
                                     group.lengths = group.lengths,
                                     uniquify.ids.suffix = word,
                                     verbose = FALSE)#verbose)
        })
      }  else  {
        ## I still need to uniquify the plot, otherwise I might get mixed up glyphs
        ## when multiple plots are on one page.
        uniquify.ids.in.svg.files(svg.filenames = plot.file.fullpath,
                                  suffixes = word)
      }

      if(ncol(adf) > 2 & !show.xy[i])
        adf <- adf[, 3:ncol(adf)]

      ## This looks like a copy-and-paste from the other branch, and it kind of is,
      ## but it has to be repeated here rather than calculated above because
      ## adf is normally modified in this brnach to give it different row names.
      table.node <- new.datanode.table(name = "table",
                                       data = adf,
                                       caption = titles[i])

      
      data.node <- new.datanode.plot(name = "plot",
                                     plot.file = plot.file.relpath,
                                     table = table.node)
    }

    datanode.json <- toJSON(data.node)
    json.file.name <- paste(sep=".", outfile.prefix, "json")
    relpaths[[i]]$data <- json.file.relpath <- file.path(data.subdir, json.file.name)
    json.file.path <- file.path(outdir, json.file.relpath)
    if(verbose)
      message("Writing JSON file ", json.file.path)

    writeLines(datanode.json, json.file.path)
  }
  
  return(relpaths)
}


.unneeded.for.static.front.end <- c("analysis-page-server.html",
                                    "js/build/concatenated-modules-aps.js",
                                    "js/config-aps.js")

##' Copy the APS front end (HTML, CSS, JS, etc) to a web directory
##'
##' This makes a copy of the complete APS \emph{static}
##' front end (HTML, CSS, JS, etc) to a web directory.
##'
##' @title copy.front.end
##' @param outdir Target directory. This directory will contain your index.html file.
##' @param client.basedir Path to client files. Default: \code{system.file("htdocs/client/dist-apss", package = "AnalysisPageServer")}.
##' Probably should not be modified except during development work on the client.
##' @param include.landing.page Boolean. Should I include the landing page "analysis-page-server-static.html"? Default: TRUE
##' @param ... Passed through to \code{file.copy}, such as \code{overwrite = TRUE}
##' @return Whatever file.copy returns.
##' @author Brad Friedman
##' @export
##' @examples
##' message("See vignette embedding.html")
copy.front.end <- function(outdir,
                           client.basedir = system.file("htdocs/client/dist-apss",
                             package = "AnalysisPageServer"),
                           include.landing.page = TRUE,
                           ...)  {
  res <- file.copy(dir(client.basedir, full.names = TRUE), outdir, recursive = TRUE, ...)
  if(!include.landing.page)  {
    landing.page <- file.path(outdir, "analysis-page-server-static.html")
    unlink(landing.page)
  }
}




##' Build the query string for a static analysis page
##'
##' All static analysis pages are deployed on top of the same HTML/Javascript/CSS stack.
##' To point the client to the correct plots and data, their paths are encoded into the
##' query part of the URL. This function performs that encoding.
##' 
##' The query string will begin with "#".
##'
##' To form a URL to view your data, simply append this query string to the URL for the application
##' \code{.html} file.
##' @title static.analysis.page.query.string
##' @param paths.list \code{paths.list} is (for example) the return value from
##' \code{.write.plots.and.data.for.static.analysis.page}. It is a list whose entries
##' correspond to the datasets on your page. Each entry is in turn a list with a \code{$plot}
##' and/or \code{$data} element, each of which is a URL (but could be relative
##' to the application \code{.html} file) to the encoded SVG and JSON data files.
##' @return Query string, starting with "#"
##' @author Brad Friedman
##' @export
static.analysis.page.query.string <- function(paths.list)  {
  ## paths.list should be unnamed list
  stopifnot(is.list(paths.list))
  stopifnot(is.null(names(paths.list)))

  n.ds <- length(paths.list)
  
  for(i in 1:n.ds)  {
    ## validate entries in paths.list. Each one should...
    ## ... be itself a list or character vector
    stopifnot(is.list(paths.list[[i]]) || is.character(paths.list[[i]]))
    ## ... have length >= 1
    stopifnot(length(paths.list[[i]]) >= 1)
    ## ... have names
    stopifnot(!is.null(names(paths.list[[i]])))
    ## ... have names "data" or "plot" only
    stopifnot(names(paths.list[[i]]) %in% c("data", "plot"))
    ## ... have no duplicated names
    stopifnot(!duplicated(names(paths.list[[i]])))
  }

  params <- unlist(lapply(1:n.ds, function(i)  {
    parts <- names(paths.list[[i]])
    sapply(parts, function(part)
           paste0("dataset", i, ".", part, "_url=", urlEncode(paths.list[[i]][[part]])))
  }))

  query.str <- paste(sep = "",
                     "#datasets?",
                     paste(collapse = "&", unname(params)))
  
  return(query.str)
}



## This is a little private state to remember where I am supposed
## be writing static data sets, front end files. Also I remember "random"
## words I've already used in the VERY unlikely event that I accidentally
## use one of them again.
.APSEnv <- list2env(list(outdir = ".",
                         libbase.prefix = "",
                         random.words = character(0)))


##' Get current AnalysisPageServer library base directory
##'
##' Get current AnalysisPageServer library base directory. This is the
##' location that contains the JS, CSS, fonts, other files required
##' to render reports. The default "" means that these will always
##' be written in the directories containing individual reports and
##' datasets. Alternatively, if you are writing a lot of reports, you
##' can set this to a system-wide location (absolute path starting
##' and ending with "/") and then \code{\link{copy.front.end}} and
##' \code{setup.APS.knitr()} will use those instead.
##' @return Path
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{set.APS.libbase.prefix}}
##' @examples
##' set.APS.libbase.prefix("/some/path/")
##' get.APS.libbase.prefix()
get.APS.libbase.prefix <- function() .APSEnv$libbase.prefix


##' Set current AnalysisPageServer library base directory
##'
##' Set current AnalysisPageServer library base directory.
##' See \code{\link{get.APS.libbase.prefix}()} for more information.
##' @return libbase.prefix, again
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{get.APS.libbase.prefix}}
##' @examples
##' set.APS.libbase.prefix("/some/path/")
##' get.APS.libbase.prefix()
##' @param libbase.prefix New libbase.prefix. Must either be empty string
##' or end with "/"
set.APS.libbase.prefix <- function(libbase.prefix) {
  stopifnot(libbase.prefix == "" || grepl("/$", libbase.prefix))
  .APSEnv$libbase.prefix <- libbase.prefix
}





##' Get current AnalysisPageServer output directory
##'
##' Get current AnalysisPageServer output directory
##' @return Path
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{set.APS.outdir}}, \code{\link{reset.APS.outdir}}
##' @examples
##' set.APS.outdir("/some/path")
##' get.APS.outdir()
##' reset.APS.outdir()
get.APS.outdir <- function() .APSEnv$outdir

##' Set current AnalysisPageServer output directory
##'
##' This directory is used by \code{\link{embed.APS.dataset}} to decide
##' where to save the .svg and .json files.
##' @param outdir New output directory
##' @return Nothing important
##' @author Brad Friedman
##' @note It seems like it would be a good idea to follow this call with an \code{on.exit(reset.APS.outdir())}.
##' But \code{on.exit} within a knitr chunk it will just first at the end of the chunk. If you are using
##' knitr then you should just call \code{setup.APS.knitr()} at the top of your document then each document
##' will have its output directory correctly set and you don't really have to worry. If you want to be
##' really anal you could call \code{reset.APS.outdir()} at the bottom of your knitr document.
##' @export
##' @seealso \code{\link{get.APS.outdir}}, \code{\link{reset.APS.outdir}}
##' @examples
##' set.APS.outdir("/some/path")
##' get.APS.outdir()
##' reset.APS.outdir()
set.APS.outdir <- function(outdir) .APSEnv$outdir <- outdir

##' Reset AnalysisPageServer output directory
##'
##' This directory is used by \code{\link{embed.APS.dataset}} to decide
##' where to save the .svg and .json files. This function resets it to
##' its default, ".".
##' @return Nothing of note
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{get.APS.outdir}}, \code{\link{set.APS.outdir}}
##' @examples
##' set.APS.outdir("/some/path")
##' get.APS.outdir()
##' reset.APS.outdir()
reset.APS.outdir <- function() set.APS.outdir(".")

##' Embed an APS dataset
##'
##' This function is meant to be called in a knitr document
##' that is being knit with \code{\link[knitr]{knit2html}}. It
##' makes a few assumptions that are valid in that context.
##'
##' It makes a call to \code{\link{static.analysis.page}} for you
##' to annotate and write the SVG and JSON files, then emits
##' the \code{<div>} element to STDOUT. \code{outdir} defaults to ".".
##' It only does one plot/dataset at a time.
##'
##' @title embed.APS.dataset
##' @param plot If present, then either an expression, a function, or a path to SVG file (not yet annotated).
##' If an then the expression will be evaluated after opening
##' a plotting device. The expression
##' will be evaluated in the calling frame, so your local variables will be
##' accessible, but this can be changed by modifying \code{eval.args}.
##' If a function, then the function will be called with no arguments. In that
##' case you would control the context yourself by setting the function's environment.
##' If path to an SVG then you would have already made the plot, and that would be used.
##' If missing then no plot is drawn---only the table is shown.
##' @param df data.frame of data. If omitted, then the return value
##' of evaluating the plotting expression or function is used (if \code{plot} is not a character).
##' @param title Caption for plot
##' @param show.sidebar Boolean, default TRUE. Set to FALSE to not show the
##' sidebar (filtering, tagging). (This is passed through directly to
##' \code{\link{aps.dataset.divs}}.)
##' @param show.table Boolean, default TRUE. Set to FALSE to not show the data
##' table (still available on download.
##' (This is passed through directly to
##' \code{\link{aps.dataset.divs}}.)
##' @param allow.zoom If TRUE (default) then allow zooming and panning. IF FALSE then
##' do not allow it.
##' @param plot.height If NULL (default) then do not specify 'data-plot-height' attribute.
##' Otherwise, use this number as 'data-plot-height' attribute, which will specify
##' the plot height (in pixels)
##' @param div.width If NULL (default) then do not specify div width in style.
##' Otherwise, supply a valid CSS width (e.g. "200px" or "60%")
##' and this will be rolled into the inline-style
##' @param style String specifying inline style of this div or NULL (default).
##' If NULL then and \code{div.width}
##' is also NULL then do not specfiy any inline style. If NULL and \code{div.width} is
##' non-NULL then create a centered div of \code{div.width} pixels wide with
##' \code{style="width:100px; margin:0 auto"} (or whatever div.width is, instead of "100px").
##' If non-NULL then use the string directly as the style attribute of the div.

##' @param num.table.rows Number of table rows to show. Default: 10
##' (This is passed through directly to
##' \code{\link{aps.dataset.divs}}.)
##' @param extra.html.classes Charvec of extra HTML classes to include in the
##' div. (This is embedded in a list then passed through directly to
##' \code{\link{aps.dataset.divs}}.)
##' @param extra.div.attr Names charvec of extra attributes to include in the div.
##' (This is embedded in a list then passed through directly to
##' \code{\link{aps.dataset.divs}}.)
##' @param svg.args Arguments (other than filename) to pass to the \code{svg}
##' function. This should be a named list. In particular, consider
##' something like \code{list(width = 8, height=5)} to change the aspect ratio.
##' @param eval.args Arguments to pass to \code{evalq} when evaluating your
##' plot code. Ignored if \code{plot} is character or a function. Otherwise
##' it should be a named list. Default is \code{list(envir = parent.frame())},
##' which means the evaluation will happen in the calling frame.
##' @param outdir Output directory. Default: \code{get.APS.outdir()}, which is
##' either "." or the directory of your knit2html target .html file.
##' @param randomize.filename Passed through to \code{\link{static.analysis.page}}
##' (but here the default is TRUE).
##' @param ... Passed through to \code{static.analysis.page}.
##'ot \code{overwrite}, \code{outdir}, or \code{write.client}
##' @return Returns the div, invisibly.
##' @author Brad Friedman
##' @export
##' @examples
##' message("See vignette embedding.html")
embed.APS.dataset <- function(plot,
                              df,
                              title,
                              show.sidebar = TRUE,
                              show.table = TRUE,
                              allow.zoom = TRUE,
                              plot.height = NULL,
                              div.width = NULL,
                              style = NULL,
                              num.table.rows = 10,
                              extra.html.classes = character(),
                              extra.div.attr = character(),
                              svg.args = list(),
                              eval.args = list(envir = parent.frame()),
                              outdir = get.APS.outdir(),
                              randomize.filename = TRUE,
                              ...)  {

  if(missing(plot))  {
    svg.file <- NA
  }  else  {
  
    ## Check if plot is a codeblock without evaluating it. 
    ## It is important to not evaluate plot until we mean to do so
    plot.is.codeblock <- is(substitute(plot), "{")
    ## The is.function() call here would already evaluate plot if it is not
    ## a codeblock. Fine.---but remember that it if you move around the lines
    ## of code.
    if(plot.is.codeblock || is.function(plot))  {
      
      svg.file <- tempfile(fileext = ".svg")
      do.call(svg, c(list(svg.file), svg.args))
      
      got <- if(plot.is.codeblock)  {
        ## This is normally the same thing as
        ##   evalq(plot, envir = parent.frame())
        ## There is a lot going on here. First, using evalq instead of eval
        ## means that plot still is not evaluated in the frame of this function.
        ## It is only evaluated by the eval function. Because we supply
        ## eval.args, that eval.args promise has to be evaluated, and so that
        ## would (under default conditions) evaluate parent.frame() in this
        ## function's frame, which would just be the calling frame. So the plotting
        ## expression is evaluated in the calling frame.
        do.call(evalq, c(list(plot), eval.args))
      }  else  {
        plot()
      }
      
      dev.off()
      on.exit(unlink(svg.file), add = TRUE)
      if(missing(df))
        df <- got
    }  else  if(is.character(plot))  {
      svg.file <- plot
    }   else  {
      stop("plot should be a codeblock, a function, or a path to an existing SVG file: ",
           paste(collapse=" ", is(plot)))
    }
  }
  
  sap <- static.analysis.page(outdir = outdir,
                              svg.files = svg.file,
                              dfs = df,
                              titles = title,
                              write.client = FALSE,
                              overwrite = TRUE,
                              randomize.filename = randomize.filename,
                              ...)

  div.html <- aps.dataset.divs(sap$paths.list,
                               show.sidebar = show.sidebar,
                               show.table = show.table,
                               allow.zoom = allow.zoom,
                               plot.height = plot.height,
                               div.width = div.width,
                               style = style,
                               num.table.rows = num.table.rows,
                               extra.html.class = list(extra.html.classes),
                               extra.div.attr = list(extra.div.attr))

  knitr::asis_output(div.html)
  
}



##' Build rapache app from an AnalysisPageRegistry
##'
##' This does most but not all of the work. You should create an R script that builds your page registry, then
##' builds an rapache.app with this function. Within that R script you call add.handlers.to.global to install
##' the 5 handlers (handle.pages/handle.params/handle.plot/handle.data/handle.meta.data).
##'
##' Next you have to tell apache to source your script upon startup. The directive for your httpd.conf is as follows:
##' \code{RSourceOnStartup "/gne/home/friedmab/scr/apache-test/R-startup.R"}
##'
##' Finally, you have to register the five handlers. This is done as follows
##'
##' @title rapache.app.from.registry
##' @param registry AnalysisPageRegistry from which to build you app.
##' @param page.param Character. Name for the parameter which specifies the page. Default "page"
##' @param textarea.wrap.param Character. Name for the parameter which specifies whether the response should be wrapped in a \code{<textarea>} tag.
##' This is needed to support file uploads in browsers, like IE9, that don't support XMLHttpRequest2. Default "textarea_wrap". In addition
##' to wrapping in textarea the response type will be set to "text/html", another hack that such browsers require.
##' @param device.param Character. Name for the parameter which specifices the plotting device. Default: "device".
##' @param decoder.param Character. Name for the parameter which specifices the form query parameter decoding method. Default: "decoder".
##' @param max.regions.param String. Name for the parameter which specifies the maximum number of regions for annotation. Default: "max_annotated_regions".
##' @param default.max.regions Default maximum number of regions for annotation. If a plot has more than this many elements then it will not be annotated.
##' Default: 10000.
##' @param force Logical. If set then an invalid registry is a warning instead of an error.
##' @param tmpdir Temporary directory into which plot files should be written. By default this
##' is taken from the WEB_TMPDIR environment variable. It is checked upon opening. It is important
##' under Apache that all of the processes use the same directory, otherwise they won't be able
##' to find the plots made by other processes.
##' @param tmpdir.timeout.seconds Temporary files will expire after this time. Default: 600 (10 minutes)
##' @param devices Named list. The names of the vector are the names of allowed plotting devices. The values
##' are themselves lists, each having a \code{$mime.type} and \code{$function}, being the ploting function.
##' Default is given by the private variable \code{.default.device.list}, and includes svg and png (but
##' uses a modified png function so that it accepts units inches).
##' Which one to be used (in the default scenario, a choice between \code{svg} and \code{png})
##' is controlled by the special \code{device.param} parameter. If that is not provided
##' then the first device from this vector is used (default default is therefore "svg", which is the
##' best since it can be annotated, but older browsers such as IE8 will need to do PNGs).
##' @param other.mime.types Named charvec giving a mapping from file extensions other than those
##' already in \code{devices} to MIME types that can be served out of the temporary storage/retrieval area.
##' Default: \code{c(json = "application/json")}.
##' @param mime.types This is a named charvec giving a mapping from file extensions to mime types. Only files with
##' extensions in this list can be served from the temporary storage/retrieval area. The default is to
##' take the extensions/MIME-types defined in \code{devices} and add to them those in \code{other.mime.tpyes}.
##' @param query.param.decoders Names list. The names are the names of allowed query param decoders (valid values for
##' the \code{decoder.param} parameter). The values are functions which do the decoding. Default is just \code{list(url=urlDecode)}.
##' \code{urlDecode} is a function supplied by RApache (or by testing framework).
##' @param brand.builder This is a function that takes a single argument called "persistent" which is a list of key value pairs representing
##' the internal "persistent" state of the app. The persistent state is a namespace that particular parameters of particular pages
##' can draw from, with the possible option of locking those parameters to the values in the persistent namespace. The purpose of the
##' \code{brand.builder} function is to return a string that should be used in the top-left corner of the web page to briefly summarize
##' the current state. The default brand builder always returns the string "AnalysisPageServer".
##' @param logger log4r object, optional
##' @return AnalysisPageRApacheApp
##' @author Brad Friedman
##' @export
rapache.app.from.registry <- function(registry,
                                      page.param = "page",
                                      textarea.wrap.param = "textarea_wrap",
                                      device.param = "device",
                                      decoder.param = "decoder",
                                      max.regions.param = "max_annotated_regions",
                                      default.max.regions = 10000,
                                      force = FALSE,
                                      tmpdir = Sys.getenv("WEB_TMPDIR"),
                                      tmpdir.timeout.seconds = 600,
                                      devices = .default.device.list,
                                      other.mime.types = c(json = "application/json"),
                                      mime.types = c(sapply(devices, "[[", "mime.type"), other.mime.types),
                                      query.param.decoders = .build.default.query.param.decoders(),
                                      brand.builder = .default.brand.builder,
                                      logger = create.logger(stderr(), log4r:::FATAL))  {

  .is.registry.or.stop(registry)
  
  e <- new.env()

  ## First check that none of the pages or the svg function have a parameter with one of the special names
  special.params <- c(page.param, decoder.param, textarea.wrap.param, device.param, max.regions.param)
  dup.spp <- names(which(table(special.params) > 1))
  length(dup.spp) == 0 || stop("Duplicate special params: ", paste(collapse=" ", dup.spp))


  ## check that the devices exist, are functions, and don't have any arguments that collide with
  ## any of the "special" parameters. And also have mime.type
  .validate.device.list(devices, special.params)

  ## check that the decoders exist and are functions
  .validate.decoder.list(query.param.decoders)

  .validate.brand.builder(brand.builder)
  
  for(page in pages(registry))  {
    ap <- get.page(registry, page)
    .check.collision.with.specials(paste(page, "page parameters"), ap$params, special.params)
  }

  ## Now we will just have a single page, and do all the control within the handler.
  e$registry <- registry

  e$special.params <- special.params
  e$page.param <- page.param
  e$textarea.wrap.param <- textarea.wrap.param
  e$decoder.param <- decoder.param
  e$query.param.decoders <- query.param.decoders
  e$brand.builder <- brand.builder

  e$logger <- logger
  e$analysis.id <- NULL  ## ID of current analysis for logging purposes. NULL means there is no current analysis, so no events should be triggered!
  e$in.analysis <- FALSE ## Boolean to indicate that we are in the midst of an analysis (rather than another type of request, such as pages or params)
  e$plot.file <- "" ## path to current plot file, also for logging purposes.
  
  e$devices <- devices
  tmpdir == "" && stop("tempdir was not provided. You can do it by setting WEB_TMPDIR environment variable, for example")
  file.exists(tmpdir) || stop("tempdir '", tmpdir, "' does not exist")
  file.info(tmpdir)$isdir || stop("tempdir '", tmpdir, "' is not a directory")
  ## Should also check here that I can create a file....but I ran out of time to write this.
  e$tmpdir <- tmpdir
  e$tmpdir.timeout.seconds <- tmpdir.timeout.seconds

  ## Lets validate the registry before beginning
  if(force)  {
    ## downgrade errors to warnings
    try(.validate.registry(registry))
  }  else  {
    .validate.registry(registry)
  }


  e$events <- new.event.registry()
  add.event(e$events, "StartAnalysis")
  add.event(e$events, "FinishAnalysis")
  add.event(e$events, "StartPlotRetrieval")
  add.event(e$events, "FinishPlotRetrieval")

  ## Add handlers (functions) for the indicated events. This are then called internally by the server when it
  ## triggers such events. Distinguish from website handlers which handle requests.
  ## All args are optional---whichever you supplyare added
  e$add.event.handlers <- function(start.analysis, finish.analysis, start.plot.retrieval, finish.plot.retrieval)  {
    if(!missing(start.analysis))
      add.event.handler(e$events, "StartAnalysis", start.analysis)
    if(!missing(finish.analysis))
      add.event.handler(e$events, "FinishAnalysis", finish.analysis)
    if(!missing(start.plot.retrieval))
      add.event.handler(e$events, "StartPlotRetrieval", start.plot.retrieval)
    if(!missing(finish.plot.retrieval))
      add.event.handler(e$events, "FinishPlotRetrieval", finish.plot.retrieval)
  }
  

  ## Check GET and POST to see if the request should be textarea-wrapped. Usually we don't want to
  ## reach back into GET or POST except via the params() function but this might be called after
  ## an error, and we don't want to pass the entire POST structure again which could be large.
  ## Returns TRUE or FALSE
  e$is.textarea.wrap.request <- function()  {
    textarea.wrap <- c(GET[[textarea.wrap.param]], POST[[textarea.wrap.param]])
    length(textarea.wrap) == 0 && return (FALSE)   # no param provided
    length(textarea.wrap) == 2 && stop("I got TWO ", textarea.wrap.param,
            " parameters; probably one from GET and one from POST. This shouldn't be possible: ",
            paste(collapse= " ", textarea.wrap))
    try(textarea.wrap <- fromJSON(textarea.wrap), silent=TRUE)
    return(isTRUE(as.logical(textarea.wrap)))
  }
  
  ## combine GET and POST (provided by rapache in the global env) into one list
  ## The list() at the beginning makes it always return a list
  ## (handles the corner case of c(list(), NULL, NULL, NULL)). Decode the params if requested
  e$params <- function()  {
    p <- c(list(), GET, POST)
    if(decoder.param %in% names(p))  {
      decoder.name <- p[[decoder.param]]
      decoder <- query.param.decoders[[decoder.name]]
      is.null(decoder) && stop("Invalid decoder '", decoder.name, "'. Known decoders: ", paste(collapse=" ", names(query.param.decoders)))
      p <- lapply(p, decoder)
    }
    return(p)
  }

  ## Return FILES (provided by rapache in the global env).
  e$file.params <- function() {FILES}

  e$process.response <- function(body, content.type, status=200, headers=character(0))  {
    textarea.wrap <- is.textarea.wrap.request()
    if(textarea.wrap)  content.type <- "text/plain"
    
    setContentType(content.type)
    if(!is.null(headers)) for(h in names(headers))  setHeader(header=h, value=headers[h])

    if(in.analysis)  {
      ## we are in an analysis and need to trigger an event
      ## First, though, copy the value of analysis.id to a local variable, and set the
      ## environment analysis.id to NULL so it will be ready for the next request
      local.analysis.id <- analysis.id
      analysis.id <<- NULL
      in.analysis <<- FALSE
      
      if(substr(content.type, 1, 6) == "image/")  {
        ## plot retrieval
        trigger.event(events, "FinishPlotRetrieval",
                      analysis.id = local.analysis.id)
        
      }  else  {
        if(status == 200)  {
          if(file.exists(plot.file))  {
            ## successful analysis with plot
            trigger.event(events, "FinishAnalysis",
                          analysis.id = local.analysis.id,
                          success = TRUE,
                          plot.file = basename(plot.file),
                          tmpdir = dirname(plot.file))
          }  else  {
            ## successful analysis without plot
            trigger.event(events, "FinishAnalysis",
                          analysis.id = local.analysis.id,
                          success = TRUE)
          }          
        }  else  {
          ## analysis error---body is a big error message
          trigger.event(events, "FinishAnalysis",
                        analysis.id = local.analysis.id,
                        success = FALSE,
                        error = body)
        }
      }
    }

    
    if(is.raw(body))  {
      ## handle raw body, such as might be delivered with PNGs.
      ## Would like to use writeBin for these. But it croaks on text connections
      ## such as STDOUT. So I need to use RApache's sendBin. What is that? I think
      ## it is just writeBin with the sectiont that tests for text connections
      ## commented out!
      sendBin(body)
    }  else  {
      ## handle character body---just print it out with "cat"
      cat(body, sep="")
    }

    return(status)
  } 
  
  ## catches errors and calls process.response
  e$handler <- function(fcn, fcn.name, err.status=400)  {
    local.fcn.name <- fcn.name  ## let's remember a pretty name for the traceback, instead of calling it local.fcn
    local.fcn <- fcn  ## need to localize this fcn to this closure, otherwise it will still be the fcn from the parent frame and will get changed in the loop
    function(...)  {
      finish <- tryKeepTraceback(local.fcn(...))
      if(is(finish, "try-error"))  {
        err.msg <- paste0("in ", deparse(conditionCall(finish$error)), ": ",
                          conditionMessage(finish$error))
        tb <- paste(collapse="\n", getTraceback(finish))
        tb <- sub("local.fcn\\(", paste(sep="", local.fcn.name, "("), tb)
        
        body <- paste(sep="\n", "ERROR", err.msg, tb)

        process.response(body, "text/plain", err.status)
      }  else  {
        process.response(finish$body, finish$content.type, finish$status, finish$headers)
      }
    }
  }

  e$page.params <- function()  {
    plist <- params()
    page <- get.page(registry, plist[[page.param]])  ## need some error handling here
    res <- new.response(body=toJSON(page$params),
                        status=200,
                        content.type="application/json")
    return(res)
  }

  e$all.pages <- function()  {
    ## I put this call here. It doesn't have anything to do with all.pages---I just have to call it occasionally to clean out the tmpdir
    ## It used to be in analysis but then there could be delays in processing the analyses. So the tempdir will be cleaned out any time
    ## someone opens or refreshes the web site.
    clean.tmpdir()

    plist <- params()
    include.services <- !is.null(plist$include_services) && plist$include_services == 1
    
    page.names <- pages(registry, include.services = include.services)
    all.info <- lapply(page.names, function(pn) {
      ap <- get.page(registry, pn)
      .page.meta.info(pn, ap)
    })
    
    res <- new.response(body=toJSON(all.info),
                        status=200,
                        content.type="application/json")
    return(res)
  }


  e$retrieve <- function()  {
    plist <- params()
    ## Need <<- instead of <- to save the result in the environment so that when we call FinishAnalysis
    ## in process.response it will be available.
    analysis.id <<- trigger.event(events, "StartPlotRetrieval",
                                  plot.file = plist$file)
    in.analysis <<- TRUE

    "file" %in% names(plist) || stop("You must provide a 'file' parameter to the 'retrieve' resource")
    path <- file.path(tmpdir, plist$file)

    file.exists(path) || stop("File does not exist: '", path, "'")
    
    extension <- sub(".*\\.", "", path)

    extension %in% names(mime.types) || stop("I've been asked to retreive a file with an extension '", extension, "' not in the list of known file extensions: ",
                                          paste(collapse=" ", names(mime.types)))
    
    mime.type <- mime.types[[extension]]

    ## For SVGs I could use readLines here, but that won't work right for PNGs, so I have to use readBin.
    ## Either way I pass a raw vector as img.data, but that's OK because process.response knows how to handle
    ## raw or character bodies.
    n <- file.info(path)[, "size"]
    img.data <- readBin(path, "raw", n=n)

    
    res <- new.response(body = img.data,
                        content.type = mime.type,
                        status = 200)
  }


  e$clean.tmpdir <- function()  {
    err <- try(remove.old.files(tmpdir, tmpdir.timeout.seconds), silent=TRUE)
    is(err, "try-error") && warning(attr(err, "condition")$message)
  }


  e$temp.plot.file <- function(page.name, device.name)  {
    tempfile(pattern=paste(sep="", "ExpPlot.", page.name, "."),
             fileext=paste(sep="", ".", device.name),
             tmpdir=tmpdir)
  }
  
  
  e$analysis <- function()  {
        
    info(logger, "analysis(): starting")
    
    plist <- params()
    fplist <- file.params()  ## uploaded file parameters---Need to keep this separate so it doesn't get JSON decoded by .prepare.params (called by execute.handler)!

    specials.in.fplist <- intersect(names(fplist), special.params)
    length(specials.in.fplist) == 0 || stop("Special parameters are not allowed as file uploads: ", paste(collapse=" ", specials.in.fplist))

    page.name <- fromJSON(plist[[page.param]])   ## this gets JSON-encoded too. It just makes things easier to JSON-encode everything.

    max.annotated.regions <- if(max.regions.param %in% names(plist))  {
      fromJSON(plist[[max.regions.param]])
    }  else  {
      default.max.regions
    }
    
    device.name <- plist[[device.param]]
    if(is.null(device.name))  device.name <- names(devices)[1]  ## default is first device, usually "svg"
    
    info(logger, paste("analysis(): page name", page.name))
    
    ## save in environment so it will be available for process.response
    plot.file <<- temp.plot.file(page.name, device.name)
    
    ## Don't pass the special params (like page anme) to the page's handler
    plist.no.specials <- plist[!names(plist) %in% special.params]

    ## info(logger, paste("analysis(): about to trigger StartAnalysis event"))
    ## saveRDS(plist.no.specials, file = "/gne/home/resexplt//x.rds")
    ## saveRDS(POST, file = "/gne/home/resexplt//post.rds")
    ## for(nm in names(plist.no.specials))  {
    ##   info(logger, paste(nm, "..."))
    ##   info(logger, paste("...", plist.no.specials[[nm]]))
    ## }
    ## info(logger, paste("analysis(): ... params = ", paste(collapse="\n", capture.output(print(plist.no.specials)))))
    ## info(logger, paste("analysis(): ... special.params = ", paste(collapse="\n", capture.output(print(plist[intersect(names(plist), special.params)])))))
    ## info(logger, paste("analysis(): ... SERVER = ", paste(collapse="\n", capture.output(print(SERVER)))))
    


    ## save analysis.id in environment so it will be available for process.response
    ## As this function evolves, try to put this trigger before any lines likely to fire errors.
    ## That way we will still have proper logs of the errors. If the error is above this line
    ## then the analysis never enters the log, and so the FinishAnalysis can't save the error.
    analysis.id <<- trigger.event(events, "StartAnalysis",
                                  page = page.name,
                                  params = plist.no.specials,
                                  special.params = plist[intersect(names(plist), special.params)],
                                  client = SERVER$remote_ip,
                                  user = SERVER$user,
                                  referer = SERVER$headers_in$Referer,
                                  user.agent = SERVER$headers_in$`User-Agent`)
    in.analysis <<- TRUE

    page <- get.page(registry, page.name)
    if(!page$no.plot)
      info(logger, paste("analysis(): plot file", plot.file))

    device.name %in% names(devices) || stop("Plotting device '", device.name,
                                            "' not among known/allowed devices: ",
                                            paste(collapse=" ", names(devices)))


    info(logger, paste("analysis(): analysis.id=", analysis.id))
    
    if(!page$no.plot)
      info(logger, paste("analysis(): device name", device.name))

    info(logger, paste("analysis(): plist.no.specials", toJSON(plist.no.specials)))
    

    annotate.plot <- page$annotate.plot && (device.name == "svg")

    info(logger, paste("analysis(): passing control to handler"))
    
    datanode <- execute.handler(page, plist.no.specials,
                                plot.file,
                                file.params=fplist,
                                device=devices[[device.name]]$`function`,
                                annotate.plot = annotate.plot,
                                logger=logger,
                                max.annotated.regions = max.annotated.regions)

    if(is(datanode, "AnalysisPageResponse"))  {
      info(logger, paste("analysis(): handler returned complete response---returning as-is."))

      return(datanode)
    }
    

    if(logger$level <  log4r:::INFO)  {
      datanode.rds <- file.path(tmpdir, "last-analysis-datanode.rds")
      info(logger, paste("analysis(): handler finished; Saving datanode to", datanode.rds))
      saveRDS(datanode, file=datanode.rds)
      
    }
    
    info(logger, paste("analysis(): JSON-encoding datanode"))
    datanode.json <- encode.datanode(datanode)

    info(logger, paste("analysis(): building response object"))
    
    res <- new.response(body = datanode.json,
                        content.type = "application/json",
                        status = 200)

    info(logger, "analysis(): returning")
    
    return(res)
  }


  e$brand <- function()  {
    plist <- lapply(params(), fromJSON)
    brand.string <- brand.builder(plist)
    res <- new.response(body = brand.string,
                        content.type = "text/html",
                        status=200)
    return(res)
  }
  
  e$resources <- function()  {
    c(analysis=analysis,
      brand=brand,
      params=page.params,
      pages=all.pages,
      status=status,
      retrieve=retrieve)
  }

  

  e$status <- function()  {
    ## return some information about the status of the current process
    plist <- params()
    fplist <- file.params()

    if(decoder.param %in% names(plist))  {
      decoder.name <- plist[[decoder.param]]
      plist <- plist[names(plist) != decoder.param]
    }  else  {
      decoder.name <- ""
    }
    
    info <- list(PID=Sys.getpid(),
                 handlers=paste(collapse=" ", names(handlers())),
                 time=as.character(Sys.time()),
                 decoder=decoder.name,
                 WEB_TMPDIR=tmpdir)

    param.text <-
      sub("\\n*$", "", capture.output(print(.prepare.params(plist, fplist))))

    env <- Sys.getenv()
    
    res <- new.response(body = paste(collapse="\n",
                          c("<html><body><pre>",
                            " *** BASIC INFO ***\n",
                            paste(names(info),"=", info),

                            "\n\n *** OPEN PLOTTING DEVICES *** \n",
                            capture.output(print(dev.list())),
                            
                            "\n\n *** PREPARED PARAMS ***\n",
                            param.text,

                            "\n\n *** SESSION INFO ***\n",
                            capture.output(sessionInfo()),

                            "\n\n *** R SEARCH PATHS ***\n",
                            capture.output(searchpaths()),

                            "\n\n *** ENVIRONMENT VARIABLES ***\n",
                            paste(names(env), "=", env),

                            "\n\n *** RAPACHE SERVER VARIABLE ***\n",
                            capture.output(print(SERVER)),
                            
                            "</pre></body></html>")),
                        status = 200,
                        content.type = "text/html")
    return(res)
    
  }

  
  e$handlers <- function()   {
    r <- resources()
    names(resource.names) <- resource.names <- names(r)
    handlers <- lapply(resource.names, function(rn) handler(r[[rn]], rn))
    names(handlers) <- paste(sep=".", "handle", names(handlers))
    return(handlers)
  }
  
  e$add.handlers.to.global <- function(pos = .GlobalEnv)  {
    handlers <- handlers()

    for(handler.name in names(handlers))
      assign(handler.name, handlers[[handler.name]], pos = pos)
  }



  e$httpd.conf <- function(location.prefix="/R", startup.script)  {
    if(missing(startup.script))  {
      lines <- character(0)
    }  else  {
      if(!any(grepl("add.handlers.to.global", readLines(startup.script))))
        stop("add.handlers.to.global not found in your startup script ", startup.script)
      
      lines <- paste("RSourceOnStartup", shQuote(startup.script))      
    }
    
    for(h in names(handlers()))  {
      resource.name <- sub("^handle.","",h)
      lines <- c(lines,
                 paste(sep="", "<Location ", file.path(location.prefix, resource.name), ">"),
                 "  SetHandler r-handler",
                 paste("  RHandler", h),
                 "</Location>")
    }
    return(lines)
  }



  

  for(method in c("analysis", "params", "file.params",
                  "add.handlers.to.global",
                  "resources", "handler", "handlers",
                  "httpd.conf", "status",
                  "page.params", "all.pages",
                  "process.response",
                  "is.textarea.wrap.request",
                  "brand",
                  "clean.tmpdir",
                  "retrieve",
                  "temp.plot.file"))  {
    environment(e[[method]]) <- as.environment(e)
  }

  class(e) <- "AnalysisPageRApacheApp"
  
  return(e)
}







##' Create a JSON representation of a data.frame
##'
##' We represent a data.frame as an hash of hashes.
##' Factors are first coerced into characters.
##'
##' The outer hash is keyed by the rownames of your data.frame
##' The inner hash is keyed by the colnames of your data.frame
##' @title data.frame.to.json
##' @param df data.frame to represent as a JSON
##' @return JSON string
##' @author Brad Friedman
##' @examples
##' df <- data.frame(A=1:3, B=3:1, C=factor(c("foo","bar","foo")), row.names = c("one", "two", "three"))
##' ## Should give the following
##' ## '{"one":{"A":1,"B":3,"C":"foo"},"two":{"A":2,"B":2,"C":"bar"},"three":{"A":3,"B":1,"C":"foo"}}'
##' data.frame.to.json(df)
##' @export
data.frame.to.json <- function(df)  {

  ## I could do
  ## empty.named.list <- list()
  ## names(empty.named.list) <- character(0)
  ## return(toJSON(empty.named.list))
  ## but why bother?
  if(nrow(df) == 0)
    return("{}")
  
  ## We return an ARRAY of HASHES
  for(i in 1:ncol(df))  if(is.factor(df[[i]]))  df[[i]] <- as.character(df[[i]])

  ## drop = FALSE is important here because otherwise in the case where there is just
  ## 1 column the row will be demoted to a scalar thing without the column name
  list.of.rows <- lapply(1:nrow(df), function(i) df[i,,drop=FALSE])
  names(list.of.rows) <- rownames(df)
  return(toJSON(list.of.rows))
}





##' Build the AnalysisPageRApacheApp for the trig example
##'
##' The toy registry has a sine page, a cosine page and the scattergram tool.
##' @title rapache.trig.app
##' @return AnalysisPageRegistry
##' @seealso \code{\link{trig.registry}}
##' @author Brad Friedman
##' @param ... Other parameters to pass through to \code{rapache.app.from.registry}, such as \code{con}
rapache.trig.app <- function(...)  {
  app <- rapache.app.from.registry(trig.registry(),
                                   ...)
  return(app)
}





##' Remove old files from a directory
##'
##' Remove old files from a directory
##' @title remove.old.files
##' @param tmpdir Path to directory whose old files you want to delete
##' @param tmpdir.timeout.seconds Time in seconds. An attempt will be made to
##' delete files with ctimes older than this many seconds before the current time.
##' @return see \code{\link{unlink}}
##' @author Brad Friedman
remove.old.files <- function(tmpdir, tmpdir.timeout.seconds)  {
  tfi <- file.info(file.path(tmpdir, dir(tmpdir)))   ## temporary file info
  old <- as.integer(Sys.time()) - as.integer(tfi$ctime) >= tmpdir.timeout.seconds
  filenames.to.delete <- rownames(tfi)[old]
  unlink(filenames.to.delete)
}



## inches.png will be png with different default arguments
inches.png <- function(..., width=7, height=7, res=72)
  png(..., width = width, height=height, units="in", res=res)

.default.device.list <- list(svg=list(mime.type="image/svg+xml", `function`=svg),
                             png=list(mime.type="image/png", `function`=inches.png))


.validate.device.list <- function(dl, special.params)  {
  is.list(dl) || stop("device list must be a list: ", paste(collapse=" ", is(dl)))
  ## devnice name
  for(dn in names(dl)) {
    ## device
    d <- dl[[dn]]
    is.list(d) || stop("device list entries must be lists, but $", dn, " is not: ", paste(collapse=" ", is(d)))
    all(sort(names(d)) == c("function", "mime.type")) || stop("device list entries must have 'mime.type' and 'function' names but for $", dn, " it has these names: ",
              paste(collapse=" ", names(d)))
    is.character(d$mime.type) || stop("device list $", dn, "$mime.type is not a character: ", paste(collapse=" ", is(d$mime.type)))
    length(d$mime.type) == 1 || stop("device list $", dn, "$mime.type is not length 1: ", length(d$mime.type))
    is.function(d$`function`) || stop("device list $", dn, "$`function` is not a function: ", paste(collapse=" ", is(d$`function`)))
    length(d$`function`) == 1 || stop("device list $", dn, "$`function` is not length 1: ", length(d$`function`))

    .check.collision.with.specials(paste(dn, "function arguments"), names(formals(d$`function`)), special.params)
  }
}

.check.collision.with.specials <- function(name, params, special.params)  {
  collision <- intersect(special.params, params)
  if(length(collision) > 0)  stop("special parameter names collide with ", name, ": ", paste(collapse= " ", collision))
}


## Build a standard list ready to send to the front end of meta-info about a page.
## name is the page name, like "2way" and ap is the AnalysisPage object
## Retval includes
## $name  $label (defaults to name)   $description (defaults to label)
## $advanced (defaults to FALSE)  $thumbnail, a URL to a thumbnail if available
.page.meta.info <- function(name, ap)  {
  stopifnot(is(ap, "AnalysisPage"))
  stopifnot("no.plot" %in% names(ap))
  a.or.b <- function(a, b)  if(is.null(a)) b else a
  meta <- list(name = name)
  meta$label <- a.or.b(ap$label, name)
  meta$description <- a.or.b(ap$description, meta$label)
  meta$advanced <- a.or.b(ap$advanced, 0)
  meta$in_menu <- ap$in.menu
                                        # If ap$thumbnail is unavailable then the following line has no effect
  meta$thumbnail <- ap$thumbnail
  
  return(meta)
}



## The reason I make this a function instead of just setting it is that urlDecode is not available at build time, since it is supplied
## either by RApache or the test framework. So we hide it in a function, then it won't be evaluated until it is needed at run time.
## And by then urlDecode will have been defined.
.build.default.query.param.decoders <- function()  {
  list(url=urlDecode)
}

.validate.decoder.list <- function(dl)  {
  is.list(dl) || stop("decoders must be a list: ", paste(collapse=" ", is(dl)))
  for(dn in names(dl))  {
    d <- dl[[dn]]
    is.function(d) || stop("decoder list entries must be functions, but $", dn, " is not: ", paste(collapse=" ", is(d)))
  }
}

.default.brand.builder <- function(persistent) "AnalysisPageServer"
.validate.brand.builder <- function(brand)  {
  is.function(brand) || stop("brand is not a function: ", paste(collapse=" ", is(brand)))
  identical(names(formals(brand)), "persistent") || stop("brand should have a single argument, persistent, but it has the following: ",
                                                         paste(collapse=" ", names(formals(brand))))
}



##' Generate httpd.conf file for RApache deployment
##'
##' Generate httpd.conf file for RApache deployment. This returns a charvec of lines of the files.
##' You still have to call \code{writeLines}.
##' See the \code{ApacheDeployment} vignette for more information.
##' @title apache.httpd.conf
##' @param driver.path Path to driver. Must contain call to add.handlers.to.global().
##' @param app.location Location from which app will be deployed (e.g. "/myapp" to make the URL
##' start "http://myserver.com/myapp").
##' @param config.js.path Path to modified \code{config.js} file. This would have been generated
##' with a call to \code{\link{config.js}}.
##' @param front.end.dir Path to front end directory content. An alias will be set up to
##' serve it directly from this location. Default is from the installed R package (found via
##' \code{system.file}.
##' @param mod.R.path Path to mod_R.so
##' @param skip.checks Boolean, default FALSE. If TRUE then don't check for file existence or for
##' the presence of "add.handlers.to.global" in the startup script.
##' @return Charvec
##' @author Brad Friedman
##' @export
apache.httpd.conf <- function(driver.path,
                              app.location,
                              config.js.path,
                              front.end.dir = system.file("htdocs/client/dist-aps", package = "AnalysisPageServer"),
                              mod.R.path,
                              skip.checks = FALSE) {

  if(!skip.checks)  {
    file.exists(driver.path) || stop("driver.path (", driver.path, ") does not exist")
    file.exists(front.end.dir) || stop("front.end.dir (", front.end.dir, ") does not exist")
    file.exists(config.js.path) || stop("config.js.path (", config.js.path, ") does not exist")
  }

  lines <- character()
  if(!missing(mod.R.path))  {
    if(!skip.checks)
      file.exists(mod.R.path) || stop("mod.R.path (", mod.R.path, ") does not exist")
    load.mod.R.line <- paste("LoadModule R_module", normalizePath(mod.R.path))
    lines <- c(lines, load.mod.R.line)
  }

  if(!skip.checks)
    if(!any(grepl("add.handlers.to.global", readLines(driver.path))))
      stop("add.handlers.to.global not found in your startup script ", driver.path)
  
  load.driver.line <- paste("RSourceOnStartup", shQuote(normalizePath(driver.path)))
  lines <- c(lines, "", load.driver.line)


  for(resource.name in c("analysis", "brand", "params", "pages", "status", "retrieve"))  {
    handler.name <- paste(sep = ".", "handle", resource.name)
    resource.location.lines <- c(paste(sep="", "<Location ", file.path(app.location, "R", resource.name), ">"),
                                 "  SetHandler r-handler",
                                 paste("  RHandler", handler.name),
                                 "</Location>")
    
    lines <- c(lines, "", resource.location.lines)
    
  }

  ## We set up the Aliases from most specific to least specific
  
  ## serve the config file from a modified copy
  config.js.url <- file.path(app.location, "client", "js", "config.js")
  config.js.path <- normalizePath(config.js.path)
  config.js.alias.line <- paste("Alias",
                                config.js.url,
                                config.js.path)
  lines <- c(lines, "", config.js.alias.line)

  ## serve the rest of the front-end directly out of installed package
  front.end.alias.line <- paste("Alias",
                                file.path(app.location, "client"),
                                front.end.dir)
  lines <- c(lines, "", front.end.alias.line)


  ## Allow service from the directories containing front-end files.
  ## (Often there is a global lockdown in the system httpd.conf that
  ## dis-allows serving any files outside of the system docroot. If not,
  ## then these lines are not required but don't hurt either.

  for(dir.path in unique(c(front.end.dir, dirname(config.js.path))))  {
    dir.lines <- c(paste(sep="",
                       '<Directory "', dir.path, '">'),
                   "  Allow from all",
                   "</Directory>")
    lines <- c(lines, "", dir.lines)
  }
  
  return(lines)
}


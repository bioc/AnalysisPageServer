
.parse.url.query.string <- function(query, eq.regex = "=", sep.regex = "[&;]", urlDecode = TRUE)  {
  param.chunks <- strsplit(query, sep.regex)[[1]]
  encoded.parts <- strsplit(param.chunks, eq.regex)
  parts <- lapply(encoded.parts, urlDecode)
  parnames <- vapply(parts, "[", 1, FUN.VALUE = "")
  parvals <- vapply(parts, "[", 2, FUN.VALUE = "")
  setNames(parvals, parnames)
}

.standardize.path <- function(path, prefix.slash = FALSE)  {
  for(pair in list(c("^/+", ""),   # remove leading slashes
                   c("/+$", ""),   # remove trailing slashes
                   c("/+", "/")))   # remove duplicate slashes
    path <- gsub(pair[[1]], pair[[2]], path)

  if(prefix.slash)
    path <- paste0("/", path)
  
  return(path)
}




##' Given an RApacheAnalysisPageServer object, create a FastRWeb-compatible handler
##'
##' FastRWeb is another alternative for deployment of AnalysisPageServer applications.
##' The benefit relative to Apache/RApache is that it may be easier to deploy. The
##' benefit relative to Rook/Rhttpd is that it actually works (Rhttpd cannot handle
##' concurrent connections). See \code{http://rforge.net/FastRWeb/} (and \code{http://rforge.net/Rserve/}) for information
##' about the FastRWeb/Rserve system. This function assumes that you've already got
##' a working installation of Rserve and fastRWeb, as described there.
##' As with that example, FastRWeb is a layer between Rserve and either CGI or PHP, so you
##' would also have to have a CGI or PHP server running. Or, you could try the experimental
##' http server that comes starting in Rserve 1.7.
##'
##' This function, \code{new.FastRWeb.analysis.page.run} returns a function which can be used as the
##' \code{run} function for a FastRWeb
##' script. So, typically, your FastRWeb script would do whatever necessary to create your
##' AnalysisPageServer Registry (or App object). Then, the last line of the script
##' would be to pass that object to this function, and assign the return value to \code{run}.
##' In other words, this function would not normally be called interactively, but only
##' within the FastRWeb framework.
##'
##' For development purposes it is quite convenient to build your AnalysisPageServer application
##' within the FastRWeb script. For example, in the default configuration,
##' you could put this into "/var/FastRWeb/web.R/APS.R":
##'
##' \code{
##'   library(AnalysisPageServer)
##'   reg <- trig.registry()
##'   run <- new.FastRWeb.analysis.page.run(reg, FastRWeb.scriptname = "APS")
##' }
##'
##' This allows you to make changes to code and reload the page without restarting the server.
##' In fact, any libraries will be reloaded, so you can change your package and re-install without
##' restarting the server.
##'
##' Once you want to move more into testing or production you'll want to do all the heavy
##' lifting in the startup script. You would have to save the \code{run} object somewhere in the Global
##' namespace and then simply return in in the FastRWeb script. Under default FastRWeb configuration
##' you could add this code to the end of the startup script "/var/FastRWeb/code/rserve.R":
##'
##' \code{
##'   library(AnalysisPageServer)
##'   myRun <- new.FastRWeb.analysis.page.run(trig.registry(), FastRWeb.scriptname = "APS")
##' }
##'
##' Then, in "/var/FastRWeb/web.R/APS.R", you could just have nothing more than this:
##'
##' \code{
##'   run <- myRun
##' }
##'
##' Note that the name of the FastRWeb script must be the same as \code{FastRWeb.scriptname}, but
##' with a ".R" suffix appended.
##'
##' It would be possible to extend this system to server multiple AnalysisPageServer apps from the
##' same FastRWeb setup. Each one would get its own FastRWeb script, and I leave it as an exercise 
##' for the reader to build them all in the Rserve startup and assign the correct handler
##' to \code{run} in each script.
##' 
##' In this example I point my browser to \code{http://localhost/cgi-bin/R/APS/dist-aps/analysis-page-server.html}
##' to open the page.
##' 
##' @title new.FastRWeb.analysis.page.run
##' @param app AnalysisPageRApacheApp. Or an AnalysisPageRegistry from which to build an app
##' (see \code{...}).
##' @param FastRWeb.scriptname Name for the app within FastRWeb. A script called \code{FastRWeb.R} would be
##' created, and the URL would be \code{FastRWeb.prefix/FastRWeb.scriptname}.
##' @param FastRWeb.prefix Prefix for all the FastRWeb resources on your server.
##' For example, if you are using a typical CGI
##' deployment, as described in the FastRWeb INSTALL document, it would be "/cgi-bin/R",
##' and your AnalysisPageServer app would be a group of URLs like /cgi-bin/R/APS/client/analysis-page-server.html etc
##' (but see \code{FastRWeb.scriptname} for \code{APS} and \code{front.end.location} for \code{client}).
##' @param APS.resources.location Location relative to App base URL from which to serve
##' dynamic AnalysisPageServer resources (like \code{analysis}, \code{pages}, and other details
##' that normal users don't have to worry about). Default, "R", is probably fine.
##' @param front.end.location Location relative to App base URL from which to serve
##' front end files. Default, "/client", is probably fine.
##' @param front.end.dir Path (in filesystem) to front end files. Default:
##' \code{system.file("htdocs", package = 'AnalysisPageServer')}
##' @param tmpdir Path to temporary directory to store files needed while the server is running. Default: \code{tempdir()}.
##' This is ignored if \code{app} is an \code{AnalysisPageRApacheApp}. This is a directory private (in the OOP sense,
##' not necessarily in the filesystem sense of the word "private") to the AnalysisPageServer system---FastRWeb never
##' sees it directly. This means in particular that it doesn't have to be within the AnalysisPageServer hierarchy.
##' @param FastRWeb.tmpdir This is the path to FastRWeb's tmpdir. FastRWeb will only serve temporary
##' files out of that directory.
##' @param referer FastRWeb does not (currently) parse the Referer from the headers,
##' but you can put a string here which will be interpreted as such. I only put this
##' here if you have an app which fails catastrophically if referer is unavaiable.
##' @param EP ExpressionPlotClient object, if needed for your app. Deprecated, and to be removed in a future version.
##' @param REST.location If \code{EP} is non-NULL, then the location from which to serve
##' REST requests (relative to app base URL). Default: "/REST". Deprecated, and to be removed in a future version.
##' @param verbose Boolean, default FALSE. If TRUE then send progress messages.
##' @param logger log4r object, optional
##' @param ... If \code{app} is actually an AnalysisPageRegistry then \code{...} is passed through
##'h it to \code{rapache.app.from.registry} to build the \code{AnalysisPageRApacheApp}.
##'just a convenient
##' @return Not sure yet....
##' @author Brad Friedman
##' @export
##' @examples
##' \dontrun{
##'   library(AnalysisPageServer)
##'   reg <- trig.registry()
##'   run <- new.FastRWeb.analysis.page.run(reg)
##' }
##' message("See vignette FastRWebDeployment.html")
new.FastRWeb.analysis.page.run <- function(app,
                                           FastRWeb.scriptname,
                                           FastRWeb.prefix = "/cgi-bin/R",
                                           APS.resources.location = "/R",
                                           front.end.location = "/dist-aps",
                                           front.end.dir = system.file("htdocs/client/dist-aps", package = 'AnalysisPageServer'),
                                           tmpdir = tempdir(),
                                           FastRWeb.tmpdir = getwd(),
                                           referer = "",
                                           EP = NULL,
                                           REST.location = "/REST",
                                           verbose = FALSE,
                                           logger = create.logger(stderr(), if(verbose) log4r:::INFO  else log4r:::FATAL),
                                           ...)  {

  checkPackageInstalled("FastRWeb") || stop("FastRWeb must be installed to create a FastRWeb-based AnalysisPageServer.")

  require("FastRWeb") || stop("FastRWeb couldn't be loaded")
    
  if(is(app, "AnalysisPageRegistry"))  {
    app <- rapache.app.from.registry(app, tmpdir = tmpdir, logger = logger, ...)
  }
  
  local.app <- app
  h <- app$handlers()
  names(h) <- sub("^handle.", "", names(h))

  global.vars <- c("POST",
                   "GET",
                   "FILES",
                   "SERVER",
                   "setContentType",
                   "setHeader",
                   "SendBin")
  
  names(global.vars) <- global.vars


  last.content.type <- NULL
  last.headers <- character()
  last.rawdata <- NULL

  mySetContentType <- function(ct)  {
    last.content.type <<- ct
  }

  mySetHeader <- function(header, value)  {
    last.headers[header] <<- value
  }

  mySendBin <- function(rawdata)  {
    tmp.fn <- tempfile()
    writeBin(rawdata, tmp.fn)
    last.rawdata <<- readBin(tmp.fn, "raw",
                             n = file.info(tmp.fn)[,"size"])
    unlink(tmp.fn)
  }


  ## Create special config file...We'll just keep it in memory
  app.prefix <- .standardize.path(file.path(FastRWeb.prefix,
                                            FastRWeb.scriptname),
                                  prefix.slash = TRUE)

  client.r.url <- .standardize.path(file.path(app.prefix, APS.resources.location),
                                    prefix.slash = TRUE)

  client.rest.url <- if(!is.null(EP))  app.prefix  else  ""


  info(logger, paste0("app.prefix = '", app.prefix, "'"))
  info(logger, paste0("client.r.url = '", client.r.url, "'"))
  info(logger, paste0("client.rest.url = '", client.rest.url, "'"))
  
  config.lines <- config.js(app.prefix = app.prefix,
                            client.r.url = client.r.url,
                            client.rest.url = client.rest.url)

  front.end.path.regex <- paste0("^/", .standardize.path(front.end.location), "/")

  APS.path.regex <- paste0("^/", .standardize.path(APS.resources.location), "/")

  REST.path.regex <- if(!is.null(EP))  paste0("^/", .standardize.path(REST.location), "/")

  
  info(logger, "Router Regexes:")
  info(logger, paste0("front.end.path.regex = '", front.end.path.regex, "'"))
  info(logger, paste0("APS.path.regex = '", APS.path.regex, "'"))
  info(logger, paste0("REST.path.regex = '", REST.path.regex, "'"))
  
  ## handle all requests. This thing has to become the "run" function in the final FastRWeb
  ## script. But right now we are just making the function.
  handler <- function(...)  {
    if(verbose)
      info(logger, "Starting FastRWeb handler")
    ## I don't know why I'm qualifying this with .GlobalEnv but that's
    ## what parse.multipart does so I'm doing it, too. I guess
    ## somehow it is safer than just request, I don't know.
    req <- .GlobalEnv$request

    save.globals <- lapply(Filter(exists, global.vars), get)
    on.exit(for(varname in names(save.globals))  assign(varname, save.globals[[varname]]))

    ## You'd think I could just do this:
    ## GET <<- list(...)
    ## However, FastRWeb does not properly parse ";" as a separator. So I'm going to
    ## do it myself. Should still be pretty quick.
    ## Note also that even though I never parse the arguments of this function
    ## directly, I still
    ## need to do (...) because otherwise it will throw an error if you try 
    ## to pass in arguments!
    GET <<- as.list(.parse.url.query.string(req$query.string))

    parsed.post <- if(grepl("application/x-www-form-urlencoded", req$c.type))  {
      .parse.url.query.string(rawToChar(req$body))
    }  else if (grepl("multipart/form-data", req$c.type))  {
      parse.multipart(req)
    }  else  {
      list()
    }

    if(verbose)  {
      info(logger, "--------------------------------------------------------------------------------------------")
      for(line in capture.output(list(request = request, parsed.post = parsed.post)))
        info(logger, line)
    }
    

    
    ## fastRweb keeps the FILES in with the rest of the POST
    ## We can sort them out since they will be lists and everything else scalars
    POST <<- Filter(Negate(is.list), parsed.post)

    SERVER <<- list(remote_ip = req$client.ip,
                    headers_in = list(Referer = referer))


    FILES <<- lapply(Filter(is.list, parsed.post), function(file.structure)  {
      ## file will have $content_type, $tempfile $filename and $head.
      ## RApache only wants $tempfile and $filename, re-named like this:
      list(name = file.structure$filename,
           tmp_name = file.structure$tempfile)
    })

    setContentType <<- mySetContentType
    setHeader <<- mySetHeader
    sendBin <<- mySendBin
    

    path <- req$path.info
    ## clear last
    last.content.type <<- NULL
    last.headers <<- character()
    last.rawdata <<- NULL
    header.lines <- character(0)

    info(logger, paste0("path = '", path, "'"))
    
    if(grepl(front.end.path.regex, path))  {
      filepath <- sub(front.end.path.regex, "", path)

      info(logger,
           paste0("... front end filepath = '", filepath, "'"))
      
      
      ## First we need to check if it is going to be a config request
      if(filepath == "js/config.js")  {
        info(logger, paste0("... front end config request"))
        payload <- config.lines
        last.content.type <- "application/javascript"
        cmd <- "html" ## doesn't mean html---just serve the lines
        
      }  else  {
        ## OK, it is any other file from the front end.
        ## Note that cmd="file" only serves files within FastRWeb's web directory,
        ## so we can't use it.
        tf <- tempfile(tmpdir = getwd())
        file.copy(file.path(front.end.dir, filepath), tf)
        cmd <- "tmpfile"  ## this means to delete tf after delivering it
        payload <- basename(tf)

        file.ext <- sub(".*\\.", "", filepath)
        last.content.type <- switch(file.ext,
                                    html = "text/html",
                                    css = "text/css",
                                    js = "application/javascript",
                                    png = "image/png",
                                    svg = "image/svg+xml",
                                    "application/octet-stream")
        
        info(logger, paste0("... front end other request ext='", file.ext, "' Content-Type='", last.content.type, "'"))
      }

      
    }  else if (grepl(APS.path.regex, path))  {

      resource.path.info <- sub(APS.path.regex, "", path)

      resource <- sub("/.*", "", resource.path.info)

      ## This is a bit ugly---we are modeling what would be seen under RApache here
      SERVER$path_info <<- resource.path.info
      
      
      ##resource <- basename(path)
      info(logger, paste0("... APS resource = '", resource, "'"))

      ## This is the money---dispatch the resource to the right function in the AnalysisPage App object
      body <- capture.output(status <- h[[resource]]())
      
      header.lines <- paste(sep = ": ", names(last.headers), last.headers)
      
      if(is.null(last.rawdata))  {
        ## Response is not raw---it should be in body.
        ## cmd="html" does not necessarily mean html.
        ## Really just means that response is in payload
        cmd <- "html"
        payload <- body
      }  else  {
        ## This is sort of an undocumentd FastRWeb thing. The server runs *in* the tempdir
        tf <- tempfile(tmpdir = getwd())
        writeBin(last.rawdata, tf)
        cmd <- "tmpfile"  ## this means to delete tf after delivering it
        payload <- basename(tf)
      }
    }  else if (!is.null(EP) && grepl(REST.path.regex, path)) {
      query <- sub(REST.path.regex, "", path)
      query <- sub("^/+", "", query)
      info(logger, paste0("REST request query='", query, "'"))
      payload <- EP$request(query)
      cmd <- "html"  ## doesn't really mean html--it just means that payload will contain the content
      last.content.type <- "application/json"
    }  else  {
      stop("Couldn't route path '", path, "'")
    }

    if(verbose)  {
      info(logger, paste0("RESPONSE cmd = '", cmd, "'"))
      payload.or.error <- tryCatch(substr(payload[1], 1, 100),
                                   error = function(e) conditionMessage(e))
      info(logger, paste0("RESPONSE payload(up to 100 chars, if valid string) = '", payload.or.error, "'"))
      info(logger, paste0("RESPONSE content.type = '", last.content.type, "'"))
      if(length(header.lines) > 0)  {
        info(logger, paste0("RESPONSE first header liner(up to 100 chars): '", substr(header.lines[1], 1, 100), "'"))
      }  else  {
        info(logger, paste0("RESPONSE no extra header lines"))
      }
    }

    WebResult(cmd = cmd,
              payload = payload,
              content.type = last.content.type,
              headers = header.lines)
              
  }


  unslash <- function(x) sub("/+$", "", sub("^/+", "", x))
  message("AnalysisPageServer landing page: ",
          file.path("http://localhost",
                    unslash(FastRWeb.prefix),
                    unslash(FastRWeb.scriptname),
                    unslash(front.end.location),
                    "analysis-page-server.html"))
  
  return(handler)
  
}


checkPackageVersion <- function(pkg, version, required = TRUE) {
  installed.version <- try(packageVersion(pkg), silent = TRUE)
  success <- if (is(installed.version, "try-error"))  {
    FALSE
  }  else  {
    installed.version >= version
  }
  if (required && !success)
    stop("Package '", pkg, "' (version >= '", version, "') required")
  success
}

##' Checks if a given package is installed.
##'
##' @title Checks if a given package is installed.
##' @param pkg A character string containing a package name.
##' @param version A minimum version number. Default: "0.0.0" (no version requirement)
##' @param required A boolean. The functions stops if set to \code{TRUE} and if the required package is not present. Default is \code{FALSE}.
##' @return A boolean.
##' @author Cory Barr
##' @export
##' @examples
##' checkPackageInstalled("AnalysisPageServer")
checkPackageInstalled <- function(pkg, version = "0.0.0", required = FALSE) {
  checkPackageVersion(pkg, version, required)
}








##' Given an RApacheAnalysisPageServer object, return a Rook app that can run it.
##'
##' new.rook.analysis.page.app
##' @title new.rook.analysis.page.app
##' @param app AnalysisPageRApacheApp. Or an AnalysisPageRegistry from which to build an app
##' @param EP ExpressionPlotClient object, if needed for your app.
##' @param front.end.location Location relative to App base directory from which to serve
##' front end files. Default: "/dist-aps".
##' @param front.end.dir Path (in filesystem) to front end files. Default:
##' \code{system.file("htdocs", package = 'AnalysisPageServer')}
##' @param app.name The name of the app you are going to use within Rook. This is used to build the prefix \code{/custom/$\{app.name\}}
##' from where the app will be served---the Javascript front end has to be notified of this. Ignored if \code{app.prefix} is supplied.
##' @param app.prefix The prefix from which the app will be served. Default: \code{/custom/$\{app.name\}}.
##' @param tmpdir Path to temporary directory to store files needed while the server is running. Default: \code{tempdir()}.
##' @param ... If \code{app} is actually an AnalysisPageRegistry then \code{...} is passed through
##' along with it to \code{rapache.app.from.registry} to build the \code{AnalysisPageRApacheApp}.
##' @return Your app, as a Rook App
##' @author Brad Friedman
##' @export
##' @seealso \code{\link{startRookAnalysisPageServer}}, \code{\link{kill.process}}
##' @examples
##' message("See vignette ExamplesServers.html")
new.rook.analysis.page.app <- function(app,
                                       EP = NULL,
                                       front.end.location = "/dist-aps",
                                       front.end.dir = system.file("htdocs/client", package = 'AnalysisPageServer'),
                                       app.name = "RAPS",
                                       app.prefix = file.path("/custom", app.name),
                                       tmpdir = tempdir(),
                                       ...)  {

  checkPackageInstalled("Rook", "1.1") || stop("Rook >= 1.1 must be installed to create a Rook-based AnalysisPageServer.")  
  
  if(is(app, "AnalysisPageRegistry"))
    app <- rapache.app.from.registry(app, tmpdir = tmpdir, ...)
  
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

  rookSetContentType <- function(ct)  {
    last.content.type <<- ct
  }

  rookSetHeader <- function(header, value)  {
    last.headers[header] <<- value
  }

  rookSendBin <- function(rawdata)  {
    tmp.fn <- tempfile()
    writeBin(rawdata, tmp.fn)
    last.rawdata <<- readBin(tmp.fn, "raw",
                             n = file.info(tmp.fn)[,"size"])
    unlink(tmp.fn)
  }

  ## not sure why in Rook context a semicolon gets added!
  trim.semicolon <- function(x) lapply(x, function(x) sub(";$", "", x))


  plot.tf <- tempfile()
  
  handler <- function(env)  {
    req <- Rook::Request$new(env)

    save.globals <- lapply(Filter(exists, global.vars), get)
    on.exit(for(varname in names(save.globals))  assign(varname, save.globals[[varname]]))
    
    POST <<- trim.semicolon(req$POST())
    GET <<- trim.semicolon(req$GET())

    SERVER <<- list(remote_ip = "127.0.0.1",
                    headers_in = list(Referer = req$referer()))


    ## This one should be fixed--something like
    ## post <- Multipart$parse(env)
    ## Then somehow parse it to figure out the FILES arguments
    FILES <<- list()
    setContentType <<- rookSetContentType
    setHeader <<- rookSetHeader
    sendBin <<- rookSendBin
    

    path <- req$path()
    resource <- basename(path)

    ## clear last
    last.content.type <<- NULL
    last.headers <<- character()
    last.rawdata <<- NULL
    
    body <- capture.output(status <- h[[resource]]())
    

    res <- Rook::Response$new()
    res$status <- status
    res$header("Content-Type", last.content.type)
    for(field in names(last.headers))
      res$header(field, last.headers[[field]])

    if(is.null(last.rawdata))  {
      res$write(body)
    }  else  {
      writeBin(last.rawdata, plot.tf)
      
      res$body <- plot.tf
      names(res$body) <- "file"
    }

    
    ##rds.path <- tempfile("x", fileext=".rds", tmpdir="~/scr/rook/")
    ##message("LH!", paste(capture.output(str(last.headers)), collapse="\n"),"\n")
    ##message("response CT = ", last.content.type, "  CL = ", content.length, "   RDS = ", rds.path, "\n\n")

    
    ##saveRDS(res, file = rds.path)
    
    res$finish()
  }
  

  
  dyn.app <- if(is.null(EP))  {
    Rook::URLMap$new('/R/' = Rook::App$new(handler))
  }  else  {
    rest.handler <- function(env)  {
      req <- Rook::Request$new(env)
      res <- Rook::Response$new()
      query <- sub("/REST/", "", req$path_info())
      got <- EP$request(query)

      res$header("Content-Type", "application/json")
      
      res$write(got)
      res$finish()
    }

    rest.app <- Rook::URLMap$new("/R/" = App$new(handler),
                                 "/REST/" = App$new(rest.handler))
  }

  stopifnot(file.exists(front.end.dir))

  static.app <- Rook::Static$new(urls = front.end.location,
                                 root = front.end.dir)


  
  config.lines <- config.js(app.prefix = app.prefix)
  root.for.config.js <- tempfile(tmpdir = tmpdir)
  dir.for.config.js <- file.path(root.for.config.js, front.end.location, "js")
  dir.create(dir.for.config.js, recursive = TRUE) || stop("Couldn't mkdir ", dir.for.config.js)
  writeLines(config.lines, file.path(dir.for.config.js, "config.js"))

  config.location <- file.path(front.end.location, "js/config.js")
  config.app <- Rook::Static(urls = config.location,
                             root = root.for.config.js)
  

  
  ## This is the final App.
  ## (1) catch requests for config.js and return the customized version instead
  ## (2) Otherwise, serve all of the static content requests for the front-end client (JS/HTML/CSS/images/etc)
  ##     (there may actually be a copy of config.js there but we'll never let it out)
  ## (3) For "server" requests under /R dispatch to the correct handler within the App.
  Rook::Builder$new(config.app,
                    static.app,
                    dyn.app)
}

##' Start a new Rook AnalysisPage server
##'
##' Start a new Rook AnalysisPage server. This is a convenience
##' wrapper around \code{\link{new.rook.analysis.page.app}}
##' which builds the Rook App and then also makes a Rook server (\code{Rhttpd} object)
##' which just contains the one App. It then starts the server in a fork and returns the PID
##' of the child process.
##' @param reg AnalysisPageRegistry from which to build application. Passed through to \code{\link{new.rook.analysis.page.app}}.
##' @param tmpdir Directory for temporary files. Passed through to \code{\link{new.rook.analysis.page.app}}. Default: \code{tempdir()}.
##' @param ... Passed through to \code{\link{new.rook.analysis.page.app}}. 
##' @param app Rook App to put into the server. Default: \code{new.rook.analysis.page.app(reg, tmpdir = tmpdir, ...)}.
##' Normally you would omit this argument.
##' @param app.name Name for App within server, default "RAPS" (for Rook AnalysisPageServer).
##' This will determine the second part of the URL, for example "/custom/RAPS".
##' @param port Port on which to start listening.
##' @return list with two componenets:
##' \describe{
##'   \item{\code{$url}}{URL to base of application}
##'   \item{\code{$pid}}{Process ID of server}
##' }
##' @author Brad Friedman
##' @seealso \code{\link{new.rook.analysis.page.app}}, \code{\link{kill.process}}
##' @export
##' @note This function used to be called \code{start.rook.analysis.page.server} but that
##' led to an R CMD check warning about S3 method inconsistency.
##' @examples
##' \dontrun{
##'   registry <- AnalysisPageServer:::trig.registry()
##'   server <- startRookAnalysisPageServer(registry, port = 5102)
##' 
##'   ## do some stuff
##'   ## For example
##'   landing.page.url <- rook.analysis.page.server.landing.page(server)
##'   ## now go to your web browser and open landing.page.url
##'
##'   ## Or maybe something in this R process. See what the pages are
##'   pages.url <- file.path(server$url, "R", "pages")
##'   pages <- fromJSON(readLines(pages.url, warn = FALSE))
##'   sapply(pages, "[[", "name")
##' 
##'   ## Kill the server
##'   kill.process(server)
##' }
##' message("See vignette ExamplesServers.html")
startRookAnalysisPageServer <- function(reg,
                                        tmpdir = tempdir(),
                                        ...,
                                        app = new.rook.analysis.page.app(reg, tmpdir = tmpdir, app.name = app.name, ...),
                                        app.name = "RAPS",
                                        port = 5000)  {
  

  checkPackageInstalled("fork") || stop("fork must be installed to start a Rook/fork-based AnalysisPageServer.")  

  require("fork") || stop("Couldn't load fork")
  
  server <- Rook::Rhttpd$new()
  server$add(app, name = app.name)

  ## File whose existence will signal that server is ready, and
  ## also used for the server to say what its URL is.
  signal.file <- tempfile()

  ## Starts NOT existing. This lines is included just for literate programming
  stopifnot(!file.exists(signal.file))

  server.pid <<- fork::fork(function() {
    tryCatch({
      server$start(port = port)
      if(server$listenPort != port)
        stop("Couldn't start Rhttpd server")
      
      ## This will make the signal file exist
      url <- server$full_url(1)
      writeLines(toJSON(list(url = url, status = "OK")), signal.file)
      Sys.sleep(Inf)
    }, error = function(e)  {
      writeLines(toJSON(list(error = conditionMessage(e), status = "ERROR")),
                 signal.file)
    })
  })
  
  ## wait for signal file to exist before returning
  while(!file.exists(signal.file))  {
    Sys.sleep(0.05)
  }
  
  res <- fromJSON(readLines(signal.file, warn = FALSE))
  unlink(signal.file)

  if(res$status == "ERROR")  {
    stop("Error starting server: ", paste(collapse="\n", res$error))
  }
  
  return(list(url = res$url,
              pid = server.pid))
}


##' Kill a process and wait for it.
##'
##' Kill a process and wait for it. Nothing more than \code{kill(pid); wait(pid)},
##' but handy to have a single function so you don't forget the \code{wait()} call.
##' @title kill.process
##' @param pid Process ID, or list with \code{$pid} component
##' @return Same as \code{\link[fork]{wait}}.
##' @author Brad Friedman
##' @export kill.process
kill.process <- function(pid)  {
  if(is.list(pid))
    pid <- pid$pid
  message("Killing process ", pid)
  fork::kill(pid) == 0 || stop("Error killing ", pid)
  fork::wait(pid)
}


##' Return URL for landing page of a Rook AnalysisPageServer
##'
##' Return URL for landing page of a Rook AnalysisPageServer
##' @title rook.analysis.page.server.landing.page
##' @param baseurl String. Base URL (typically ending in "/custom/RAPS"), or a list with \code{$url} element.
##' @return String, full URL to landing page.
##' @author Brad Friedman
##' @export
##' @examples
##' message("See vignette ExamplesServers.html")
rook.analysis.page.server.landing.page <- function(baseurl)  {
  if(is.list(baseurl))
    baseurl <- baseurl$url
  file.path(baseurl, "dist-aps", "analysis-page-server.html")
}



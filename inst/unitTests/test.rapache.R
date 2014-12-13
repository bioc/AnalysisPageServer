  

test.rapache <- function()  {
  source(system.file("unitTests/shared.R", package = "AnalysisPageServer"))
  
  Sys.setenv(WEB_TMPDIR=tempdir())

  
  ## This doesn't test within Apache, but it tests up to the interface
  startup.script <- system.file("rapache.test.server.startup.R", package="AnalysisPageServer")

  logger <- log4r::create.logger(stderr(), log4r:::INFO)

  log4r::info(logger, "sourcing startup.script")
  source(startup.script)
  ##print(list(ls=ls(e), ss=startup.script))
  log4r::info(logger, "sourced startup.script")
  checkTrue(all(paste(sep=".", "handle", c("analysis","pages","params", "status")) %in% ls(.GlobalEnv)),
            "handlers were added to global")
  
  checkIdentical(app$query.param.decoders, list(url=urlDecode),
                 "default query param decoders correctly gets urlDecode from global Env")
  
  registry <- app$registry

  last.content.type <- NULL
  last.headers <- character()
  last.rawdata <- NULL
  setContentType <<- function(ct)  {
    last.content.type <<- ct
  }

  setHeader <<- function(header, value)  {
    last.headers[header] <<- value
  }

  sendBin <<- function(rawdata)  {
    tmp.fn <- tempfile()
    writeBin(rawdata, tmp.fn)
    last.rawdata <<- readBin(tmp.fn, "raw",
                             n = file.info(tmp.fn)[,"size"])
    unlink(tmp.fn)
  }

  clear.last <- function()  {
    last.content.type <<- NULL
    last.headers <<- character()
    last.rawdata <<- NULL
  }

  capture.response <- function(resource, GET=list(), POST=list(), FILES=list(),
                               SERVER = list(remote_ip = "1.1.1.1",
                                 user = NULL,
                                 headers_in = list(`User-Agent` = "RUnit-TestMore")))  {
    assign("GET", GET, .GlobalEnv)
    assign("POST", POST, .GlobalEnv)
    assign("FILES", FILES, .GlobalEnv)
    assign("SERVER", SERVER, .GlobalEnv)
    on.exit(rm("GET", "POST", "FILES", "SERVER", pos = .GlobalEnv))
    rn <- paste(sep=".", "handle", resource)
    f <- get(rn)
    body <- capture.output(status <- f())
    retval <- list(status=status,
                   body=body,
                   content.type=last.content.type,
                   headers=last.headers,
                   rawdata=last.rawdata)
    clear.last()
    return(retval)
  }

  check.response <- function(res, expected, test.name)  {
    for(field in names(expected))
      checkEquals(res[[field]], expected[[field]], paste(test.name, field))
  }
 
  log4r::info(logger, "checking 'pages' response")

  expected.page.info <-
    lapply(pages(registry), function(pn)  AnalysisPageServer:::.page.meta.info(pn, get.page(registry, pn)))
  check.response(capture.response("pages"),
                 list(status=200,
                      body=rjson::toJSON(expected.page.info),
                      content.type="application/json"),
                 "pages")

  ## params request
  sine.pars <- capture.response("params", list(page="sine"))
  expected.pars <- lapply(get.page(registry, "sine")$params,
                          unclass)
  check.response(sine.pars,
                 list(status=200,
                      body=rjson::toJSON(expected.pars),
                      content.type="application/json"),
                 "sine params")

  xmin <- -pi
  xmax <- pi
  n.pts <- 100
  query.raw <- c(page="sine", xmin=xmin, xmax=xmax, n=n.pts)
  query.json <- lapply(query.raw, rjson::toJSON)
  res <- capture.response("analysis", query.json)
  checkEquals(res$content.type, "application/json", "analysis content-type is correct")

  body <- rjson::fromJSON(res$body)

  checkEquals(body$type, "plot", "AnalysisPageDataNode type correct")

  value <- body$value
  table <- value$table$value
  plot <- value$plot


  ## The following section is a bit weird. The sine.handler function returns a data frame with x and y, and that used to be passed through, so this section
  ## used to test those values. But now they are stripped, so the tests aren't doing much any more.
  ## First see about the data
  svg(.dev.null)
  expected.data <- do.call(AnalysisPageServer:::sine.handler, as.list(query.raw[names(query.raw) != "page"]))
  dev.off()
  expected.ids <- AnalysisPageServer:::make.standard.ids(n.pts)
  rownames(expected.data) <- expected.ids

  got.data <- table$data
  reg.ids <- names(got.data)
  got.data.frame <- data.frame(row.names=reg.ids)#do.call(data.frame, c(lapply(c(x="x",y="y"), function(xy) sapply(got.data, "[[", xy)), list(row.names=reg.ids)))

                                        # There will have been some rounding, so be tolerant
  checkEquals(got.data.frame, expected.data[setdiff(names(expected.data), c("x","y"))] , tolerance = 1e-5, "data served correctly")

  expected.adf <- AnalysisPageServer:::annotate.data.frame(expected.data)
  expected.vmd <- Biobase::varMetadata(expected.adf)
  expected.meta.json <- data.frame.to.json(expected.vmd)
  expected.meta <- rjson::fromJSON(expected.meta.json)

  checkEquals(table$meta, list(), "meta.data correct")




  ## The plot should have been made, (but not yet returned)
  exp.path <- file.path(app$tmpdir, plot)
  checkTrue(file.exists(exp.path),
            "Plot image exists")

  ## Now try to retrieve it
  retrieve.res <- capture.response("retrieve", list(file=plot))
  plot.path <- file.path(tempdir(), plot)
  check.response(retrieve.res,
                 list(status = 200,
                      content.type = "image/svg+xml",
                      rawdata = readBin(plot.path, n = file.info(plot.path)[,"size"], what="raw")))

  ## Test auto-removal of the old file
  Sys.sleep(1)
  stopifnot(file.exists(plot.path))
  AnalysisPageServer:::remove.old.files(tempdir(), 1)
  checkTrue(!file.exists(plot.path), "remove.old.files cleared the file from the temp dir")


  svg.txt <- rawToChar(retrieve.res$rawdata)

  x <- seq(xmin,xmax,length=n.pts)
  check.plot <- function(svg.txt, x, y, ids)  {
    svg.doc <- xmlParse(svg.txt)
    ## these two functions from the shared.R file in this directory
    pp <- safeGetPlotPoints(svg.doc)
    xy <- get.plot.element.coords(pp)
    checkEquals(diag(cor(xy, cbind(x,y))), c(1, -1), "plot coordinates correct")
    attr <- sapply(pp, xmlAttrs)
    checkEquals(unname(attr["id",]), ids, "IDs correct")
    checkTrue(all(attr["class",] == "plot-point"), "class correct")
  }

  if(platformIsWindows())  {
    message("Skipping check.plot on windows (part of test.rapache)")
  }  else  {
    check.plot(svg.txt, x, sin(x), expected.ids)
  }




  res.png <- capture.response("analysis", c(query.json, device="png", width="9", height="7"))
  body.png <- rjson::fromJSON(res.png$body)
  value.png <- body.png$value
  table.png <- value.png$table$value
  data.png <- table.png$data
  meta.png <- table.png$meta
  plot.png <- value.png$plot
  ## unname here because when device="png" plot is not annotated and standard IDs are not applied.
  ## So the data will have different names
  checkEquals(unname(data.png),
              unname(got.data),  ## the response from the SVG request above
              "PNG request: data unchanged")
  checkEquals(meta.png,
              table$meta,   ## the response from the SVG request above
              "PNG request: meta unchanged")

  ## Now try to get the PNG data
  exp.png.path <- file.path(app$tmpdir, plot.png)
  checkTrue(file.exists(exp.png.path), "PNG plot created")
  png.data <- readBin(exp.png.path, "raw", file.info(exp.png.path)[,"size"])
  checkEquals(png.data[1:8], charToRaw("\x89PNG\r\n\032\n"),
              "PNG header present in PNG data")
  retrieve.png.res <- capture.response("retrieve", list(file=plot.png))
  
  
  ## In the context of this test script, sendBin() should have been called and the
  ## PNG image should be in $rawdata
  checkEquals(retrieve.png.res$rawdata, png.data, "Data retrieved matches file exactly")




  ## what happens when I send an error?
  res <- capture.response("params", GET=list(page="nonsense"))  # a non-existant page
  check.response(res,
                 list(status=400, content.type="text/plain"),
                 "error response")
  checkEquals(res$body[1:2],
              c("ERROR","No such page 'nonsense' in registry"),
              "error message starts correctly")



  ## check these functions that help make the apahce conf
  got <- app$httpd.conf(startup.script=startup.script)
  expected <- sub("\\$startup.script", shQuote(startup.script), readLines(system.file("testdata/httpd.conf", package="AnalysisPageServer")))
  checkEquals(got, expected, "httpd.conf as expected")







  ## Now try an IE-like request where textarea_wrap is set.
  ## Remember this is an old name for the request. At one point we were trying
  ## to serve the data wrapped in a <textarea> element. We keep calling the parameter
  ## by the same name, but Adrian figured out that IE8 would be happy if we just
  ## set the content-type to text/plain.
  res <- capture.response("pages", list(textarea_wrap="true"))

  check.response(res,
                 list(status=200,
                      body=paste(sep="", rjson::toJSON(expected.page.info)),
                      content.type="text/plain"),
                 "textarea-wrapped pages")



  ## Now see that the annotate.data.frame and no.plot attributes are handled correctly
  ## The dataonly analysis page has annotate.data.frame=FALSE and no.plot=TRUE
  res <- capture.response("analysis", list(page=rjson::toJSON("dataonly")))
  check.response(res,
                 list(status=200,
                      body=rjson::toJSON(AnalysisPageServer:::dataonly.handler()),
                      content.type="application/json"),
                 "dataonly page correct (annotate.data.frame=FALSE, no.plot=TRUE)")

  ## The dataframeonly analysisp page has annotate.data.frame=TRUE and no.plot=TRUE
  res <- capture.response("analysis", list(page=rjson::toJSON("dataframeonly")))
  df <- AnalysisPageServer:::dataframeonly.handler()
  adf <- AnalysisPageServer:::annotate.data.frame(df, required.fields=character(0))
  exp.body.json <- rjson::toJSON(new.datanode.table("table", adf))
  check.response(res,
                 list(status=200,
                      body=exp.body.json,
                      content.type="application/json"),
                 "dataframeonly page correct (annotate.data.frame=TRUE, no.plot=TRUE)")





  ## Now test the decode parameter thingy
  check.par.process <- function(value, expected, decoder)  {
    params <- list(foo=rjson::toJSON(value))
    if(!missing(decoder))  params$decoder <- decoder
    res <- capture.response("status", params)
    body <- res$body
    ## body is a big report, the status page. It is not really formatted for a computer to parse but for a human.
    ## However, part of the report contains the interpreted values of the submitted variables, including foo.
    ## "foo" is an "other" variable, which just means it is not a special. So there will be a line "$other$foo"
    ## and then the next line will have its value, but printed out with R's print function
    i.other.foo <- grep("\\$other\\$foo", body)
    got.printed.foo <- body[i.other.foo + 1]
    expected.printed.foo <- capture.output(print(expected))
    checkEquals(got.printed.foo, expected.printed.foo, paste(sep="", "'", value, "' gets processed as '", expected, "'"))
  }

  
  check.par.process("bar baz", "bar baz")
  check.par.process("bar+baz", "bar+baz")
  check.par.process("bar+baz", "bar baz", decoder="url")




  ## test the brand
  
  res <- capture.response("brand", list())
  checkEquals(res$body, "AnalysisPageServer")

  app <- AnalysisPageServer:::rapache.trig.app(brand=function(persistent) paste("APS:", persistent$study))
  app$add.handlers.to.global()  # overwrite existing handlers
  res <- capture.response("brand", list())
  checkEquals(res$body, "APS: ")
  
  res <- capture.response("brand", list(study="\"foo\""))
  checkEquals(res$body, "APS: foo")

  res <- capture.response("brand", list(comp="\"foo\""))
  checkEquals(res$body, "APS: ")





  ## try an analysis that returns a full-fledged response
  full.response.handler <- function()  {
    new.response(body="Hello, world!",
                 content.type = "text/plain",
                 headers = c(`X-Header1` = "value 1",
                   `X-Header2` = "value 2"))
  }
  full.response.page <- new.analysis.page(full.response.handler,
                                          annotate.plot=FALSE,
                                          annotate.data.frame=FALSE,
                                          no.plot=TRUE,
                                          name="helloworld")
  app$registry <- register.page(registry, "hello", full.response.page)

  res <- capture.response("analysis", list(page=rjson::toJSON("hello")))
  check.response(res, expected=full.response.handler(), " full response handler")



  ## check StartAnalysis and FinishAnalysis triggers
  start.args <- list()
  finish.args <- list()
  id <- 0
  clear.sfi <- function()  {
    start.args <<- finish.args <<- list()
    id <<- 0
  }
  ##on.exit(rm(list=c("id", "trigger.data"), pos=.GlobalEnv), add = TRUE)
  add.event.handler(app$events, "StartAnalysis",
                    function(...)  {
                      start.args <<- list(...)
                      id <<- id + 1
                      return(id)
                    })
  
  add.event.handler(app$events, "FinishAnalysis",
                    function(...)  {
                      finish.args <<- list(...)
                    })

  SERVER <- list(remote_ip = "1.1.1.1",
                 user = NULL,
                 headers_in = list(`User-Agent` = "RUnit-TestMore"))

  res <- capture.response("analysis", list(page=rjson::toJSON("hello"), decoder = "url"), SERVER = SERVER)

  checkEquals(id, 1,
              "StartAnalysis event successfully triggered")

  checkEquals(start.args,
              list(page = "hello",
                   params = setNames(list(), character()),  ## make it a "named" list without any named---just to match the type exactly
                   special.params = list(page=rjson::toJSON("hello"), decoder = "url"),
                   client = "1.1.1.1",
                   user = NULL,
                   referer = NULL,
                   user.agent = SERVER$headers_in$`User-Agent`),
              "StartAnalysis sent correct arguments")

  checkEquals(finish.args,
              list(analysis.id = 1,
                   success = TRUE),
              "FinishAnalysis event successfully triggered")
  

  
  ## Next see how an error gets logged
  clear.sfi()
  res <- capture.response("analysis", list(page=rjson::toJSON("foo")))
  checkEquals(id, 1)
  checkEquals(finish.args[c("analysis.id", "success")],
              list(analysis.id = 1, success = FALSE))
  checkTrue(grepl("^ERROR\nNo such page 'foo' in registry", finish.args$error))


  ## Now register handlers for plot retrieval
  add.event.handler(app$events, "StartPlotRetrieval",
                    function(...)  {
                      start.args <<- list(...)
                      return(id)
                    })
  
  add.event.handler(app$events, "FinishPlotRetrieval",
                    function(...)  {
                      finish.args <<- list(...)
                    })

  ## Now do an analysis that makes a plot, then retrieve the plot
  clear.sfi()
  res <- capture.response("analysis", list(page=rjson::toJSON("sine")))
  pf <- rjson::fromJSON(res$body)$value$plot

  ## This looks like it ought to just be
  ##   exp.tmpdir <- tempdir()
  ## However on windows it is not the same thing. tempdir()
  ## returns a path with backslashes whereas dirname() (which
  ## ultimately is what makes the tmpdir component) returns
  ## one with front-slashes. So we do this awkward thing to
  ## make them agree on Windows. On unix it is the same
  exp.tmpdir <- dirname(file.path(tempdir(), "."))

  checkEquals(finish.args,
              list(analysis.id = id,
                   success = TRUE,
                   plot.file = pf,
                   tmpdir = exp.tmpdir))

  res <- capture.response("retrieve", list(file=pf))
  checkEquals(start.args,
              list(plot.file = pf))
  checkEquals(finish.args,
              list(analysis.id = id))


  clear.sfi()
  res <- capture.response("pages")
  checkEquals(finish.args, list(), "pages resource does not trigger any event")






  ## Now see if we are capturing warnings correctly.
  warning.messages <- c("first warning", "second warning")
  warning.handler <- function()  {
    warning(warning.messages[1])
    warning(warning.messages[2])
    data.frame(x=numeric(), y= numeric())
  }
  warning.page <- new.analysis.page(warning.handler,
                                    annotate.plot=FALSE,
                                    annotate.data.frame=TRUE,
                                    no.plot=TRUE,
                                    name="throwswarnings")
  app$registry <- register.page(registry, "throwswarnings", warning.page)
  res <- capture.response("analysis", list(page = rjson::toJSON("throwswarnings")))
  checkEquals(rjson::fromJSON(res$body)$warnings, warning.messages)
  
}

test.device.list <- function()  {
  ddl <- AnalysisPageServer:::.default.device.list
  special.params <- c("page", "textarea_wrap", "device")

  checkTrue(tryCatch({AnalysisPageServer:::.validate.device.list(ddl, special.params)
                      TRUE},
                     error=function(e) FALSE),
            "default device list validates")
}



test.page.meta.info <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  pmi <- AnalysisPageServer:::.page.meta.info

  label <- "sine function"
  page <- new.analysis.page(AnalysisPageServer:::sine.handler,
                            label=label)



  checkEquals(pmi("sine", page),
              list(name="sine",
                   label=label,
                   description=label,
                   advanced=0,
                   in_menu=TRUE),
              "Page meta info correcT")
}

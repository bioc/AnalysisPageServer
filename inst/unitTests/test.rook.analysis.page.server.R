test.rook.analysis.page.server <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  if(platformIsWindows())  {
    message("Skipping test.rook.analysis.page.server on windows since the test requires fork")
    return()
  }

  if(checkPackageInstalled("Rook", "1.1"))  {
    require(fork) || stop("Couldn't load fork")
    dir.create(td <- tempfile())
    
    sh <- function (xmin = 0, xmax = 3 * pi, n = 100) {
      xmin <- as.numeric(xmin)
      xmax <- as.numeric(xmax)
      n <- as.numeric(n)
      x <- seq(xmin, xmax, length = n)
      y <- sin(x)
      plot(x, y, pch = 19, col = "seagreen")
      ids <- make.unique(rep(LETTERS, length = n))
      retval <- data.frame(x = x, y = y, X = x, Y = y, ids = ids, row.names = ids)
      
      return(retval)
    }

    
    reg <- register.page(new.registry(), "sine", sh)
    
    
    reg <- register.page(registry = reg,
                         page.name = "IP",
                         page = build.service(client.ip))

    port <- 5998
    server <- startRookAnalysisPageServer(reg, port = port)
    on.exit(kill.process(server))

    ## Rook application is running now in another process
    
    landing.url <- rook.analysis.page.server.landing.page(server)
    checkEquals(landing.url,
                "http://127.0.0.1:5998/custom/RAPS/dist-aps/analysis-page-server.html")

    if(FALSE)  {
      ## You can open it like this if you want to manually test
      cmd <- paste("open", landing.url)
      system(cmd)
    }
    
    ## Let's build (but not deploy) the RApache application so we can check the Rook application is
    ## correct
    dir.create(tmpdir2 <- tempfile())
    app <- rapache.app.from.registry(reg, tmpdir = tmpdir2)


    got <- readLines(landing.url)
    checkEquals(got, readLines(system.file("htdocs/client/dist-aps/analysis-page-server.html", package="AnalysisPageServer")))

    base.url <- server$url


    ## These are needed because what we are testing here is an adapter class.
    ## Rook wraps the RApache class and, unfortunately, the RApache class works through
    ## these globals. So we'll send URLs to the Rook server and then compare them to what
    ## we get when we run the application via the RApahace interface (albeit not within RApache).

    set.GPF <- function(g = list(), p = list(), f = list())  {
      assign("GET", g, pos = .GlobalEnv)
      assign("POST", p, pos = .GlobalEnv)
      assign("FILES", f, pos = .GlobalEnv)
    }
    clear.GPF <- function()
      rm("GET", "POST", "FILES", pos = .GlobalEnv)
    
    with.GPF <- function(expr, ...)  {
      set.GPF(...)
      on.exit(clear.GPF(), add = TRUE)
      eval(expr)
    }


    pages.url <- file.path(base.url, "R/pages")
    expected <- with.GPF(app$all.pages()$body)
    checkEquals(readLines(pages.url, warn = FALSE),
                expected)
                

    
    params.url <- file.path(base.url, "R/params?page=sine")
    got <- readLines(params.url, warn=FALSE)
    expected <- with.GPF(app$page.params()$body, list(page="sine"))
    checkEquals(got, expected)

    
    xmin <- 0
    xmax <- 10
    n <- 11
    width <- 9
    height <- 7
    analysis.url <- file.path(base.url, paste0("R/analysis?page=\"sine\"&xmin=", xmin, "&xmax=", xmax, "&n=", n, "&width=", width, "&height=", height))
    got <- rjson::fromJSON(readLines(analysis.url, warn = FALSE))

    plist <- lapply(list(page = "sine", xmin = xmin, xmax = xmax, n = n), rjson::toJSON)
    expected <- rjson::fromJSON(with.GPF(app$analysis()$body, plist))
    ## remove plot elements since they will be different
    got.no.plot <- got
    got.no.plot$value$plot <- NULL
    exp.no.plot <- expected
    exp.no.plot$value$plot <- NULL
    checkEquals(got.no.plot, exp.no.plot)

      
    ## Now retrieve the plots and check they are correct
    ## Need to fetch from filesytem before fetching by URL because after serving the plot it is deleted
    exp.plot.file <- tempfile()
    svg(exp.plot.file, width = width, height = height)
    ## invisible since it returns data frame which we are going to ignore
    invisible(sh(xmin = xmin, xmax = xmax, n = n))
    dev.off()
    
    exp.plot <- readLines(exp.plot.file)
    retrieve.url <- file.path(base.url, paste0("R/retrieve?file=", got$value$plot))
    got.plot <- readLines(retrieve.url, warn = FALSE)
    check.same.svgs(got.plot, exp.plot)
    
  }  else  {
    warning("Rook (>= 1.1) is not installed so Rook-based tests were not run")
  }
}

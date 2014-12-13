test.plot.pars.transformer <- function()  {
  library(RUnit)
  library(AnalysisPageServer)


  transformer <- function(plot, other)  {
    n <- ifelse(is.null(other$n), 1, other$n)
    n <- as.numeric(n)
    height <- 5 + n / 20
    width <- 6 + n / 15

    plot.pars <- list(width=width, height=height)
    return(plot.pars)
  }

  ## * 72 is for 72 dpi --- gives plot dims in pixels, which you can check in browser
  ## I would prefer round() to floor() but that is not what happens,
  ## and this is controlled within the svg driver. Anyway, we are talking about 1 pixel out of hundreds!!! Who is going to notice?
  exp.dims <- function(n)  {
    pars <- transformer(list(), list(n=n))
    return(floor(unlist(pars) * 72))
  }
  
  sine.ap <- new.analysis.page(handler = AnalysisPageServer:::sine.handler,
                               plot.pars.transformer = transformer)


  execute.handler <- AnalysisPageServer:::execute.handler



  plot.file <- tempfile(fileext=".svg")
  ret1 <- execute.handler(sine.ap, list(n="2"), plot.file)

  get.plot.dims <- function(svg.file)  {
    svg.line <- grep("^<svg ", readLines(svg.file), val = TRUE)
    parts <- strsplit(svg.line, " ")[[1]]
    tags <- Filter(function(x) length(x) == 2, strsplit(parts, "="))
    tag.vals <- gsub("(^\\\"|\\\">?$)", "", sapply(tags, "[", 2))
    names(tag.vals) <- sapply(tags, "[", 1)

    stopifnot(c("width","height") %in% names(tag.vals))
    stopifnot(grepl("^\\d+pt$", tag.vals[c("width","height")]))
    d <- as.integer(sub("pt$", "", tag.vals[c("width", "height")]))
    return(d)
  }

  checkEquals(get.plot.dims(plot.file),
              unname(exp.dims(2)))


  ret2 <- execute.handler(sine.ap, list(n="100"), plot.file)
  checkEquals(get.plot.dims(plot.file),
              unname(exp.dims(100)))

  checkTrue(all(sapply(list(ret1, ret2), is, "AnalysisPageDataNode")),
            "handler returned AnalysisPageDataNode's")

}



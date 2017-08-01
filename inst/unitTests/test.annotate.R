test.annotator.simple <- function()  {
  ## Make a simple scattergram and check that we can annotate it
  
  library(XML)
  library(RUnit)
  library(AnalysisPageServer)

  n <- 100
  
  x <- rnorm(n)
  y <- x + rnorm(n) * 0.1
  fn <- tempfile(fileext = ".svg")
  ids <- paste(sep="", "Reg", 1:n)

  for(start in 1:2)  {
    ## This is testing two cases. The case start=1 is the simplest one. I make 100 points and find them again.
    ## The case start=2 is a bug that came up. I make 100 points and tag the last 99. When the match was the suffix
    ## of the plot region node AND it was not the whole node then it was not getting tested
    svg(fn)
    plot(x,y)
    dev.off()
    
    got <- annotate.analysis.page.svg(fn, x[start:n], y[start:n], ids[start:n]
                                      )
    ## Both of these guys are nodes 0 .. 99
    checkEquals(got, n)
    
    doc <- xmlParse(fn)
    xmlList <- xmlToList(doc)

    ## Handle two types of plots
    ## First try the newer R3 plots that my laptop makes
    pp <- xmlList$g[(1+start):(n+1)]

    ## Next, if necessary, try the older type of plots that our server makes
    if(any(sapply(pp, is.null)))
      pp <- xmlList$g$g[start:n]

    

    get.attr <- function(aname) sapply(pp, "[[", aname)
    ## this one might pass since getPlotPoints adds the class when it parses!
    checkTrue(all(get.attr("class") == "plot-point"),
              paste(sep="", "Provided class='plot-point' for ", start, ":", n))
  
    checkTrue(all(get.attr("id") == paste(sep="", "Reg", start:n)),
              paste(sep="", "Provided ids 'Reg", start, "', ..., 'Reg100'"))
  }


  ## check that no match returns -1
  svg(fn)
  plot(x, y)
  dev.off()

  got <- annotate.analysis.page.svg(fn, x, -y, ids)
  (is.null(got))
}



## We turn this test off because it has extra outside dependencies we don't
## want to involve, but it is OK to have it around to run manually if necessary.
off.test.annotator.strip.plot <- function()  {
  ## Use a more complicated plot, (made by ExpressionPlotting::strip.plot)
  ## and check that we can annotate it.

  library(AnalysisPageServer)
  library(XML)
  # library(SVGAnnotation)
  library(RUnit)

  data.dir <- system.file("testdata", package="AnalysisPageSVGAnnotator")

  x <- readRDS(file.path(data.dir, "strip-plot-x.rds"))
  y <- readRDS(file.path(data.dir, "strip-plot-y.rds"))
  svg.file <- file.path(data.dir, "strip-plot.svg")

  tf <- tempfile(fileext=".svg")
  file.copy(svg.file, tf)

  n <- length(x)
  ids <- paste(sep="", "Reg", 1:n)
  
  annotate.analysis.page.svg(tf, x, y,
                             ids = ids)

  pps <- getPlotPoints(xmlParse(tf))
  ## getPlotPoints returns 2 nodes, first is parent of stripes and second is parent of plot points
  ## Open the .svg file and look at it if you are confused!
  stopifnot(length(pps) == 2)

  get.attr <- function(aname)  unname(sapply(lapply(pps[[2]][1:n], xmlAttrs), "[", aname))
  checkEquals(get.attr("class"), rep("plot-point", n))
  checkEquals(get.attr("id"), ids)

  ## the next "PlotPoint" is part of a boxplot. It got the "plot-point" class because getPlotPoints
  ## does that whether you like it or not, but it should not an "id" attribute.
  checkTrue(!"id" %in% xmlAttrs(pps[[2]][[n+1]]))
}




test.uniquify.ids <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  
  orig.filename <- system.file("testdata/strip-plot.svg", package = "AnalysisPageServer")
  stopifnot(file.exists(orig.filename))

  orig.lines <- readLines(orig.filename)

  svg.filename <- tempfile(fileext = ".svg")
  file.copy(orig.filename, svg.filename) || stop("Couldn't copy")

  uniquify.ids.in.svg.files(svg.filename,
                            "ABCD")

  got.lines <- readLines(svg.filename)
  stopifnot(any(orig.lines != got.lines))


  expected.lines <- function(orig.lines, word)  {
    elines <- orig.lines
    elines <- sub("glyph", paste0("glyph_", word, "_"), elines)
    elines <- sub("\"clip", paste0("\"clip_", word, "_"), elines)
    elines <- sub("#clip", paste0("#clip_", word, "_"), elines)
    return(elines)
  }
  
  exp.lines <- sub("#clip", "#clip_ABCD_", sub("\"clip", "\"clip_ABCD_", sub("glyph", "glyph_ABCD_", orig.lines)))
  checkEquals(got.lines, expected.lines(orig.lines, "ABCD"),
              "substitutions made as expected")

  if(FALSE)  {
    system(paste("open -a /Applications/Safari.app", svg.filename))
  }


  ## now try 2 files
  svg1 <- tempfile(fileext = ".svg")
  svg2 <- tempfile(fileext = ".svg")
  writeLines(orig.lines, svg1)
  writeLines(orig.lines, svg2)
  uniquify.ids.in.svg.files(c(svg1, svg2))

  words <- sapply(c(svg1, svg2), function(path)
                  substr(sub(".*glyph_", "", grep("glyph_", readLines(path), value = TRUE)[1]), 1, 6))

  checkTrue(words[1] != words[2])

  for(i in 1:2)  {
    got.lines <- readLines(c(svg1, svg2)[i])
    exp.lines <- expected.lines(orig.lines, words[i])
    checkEquals(got.lines,
                exp.lines)
  }
  
}


test.annotator.heatmap <- function() {
  library(AnalysisPageServer)

  mtx <- matrix(1:12, nrow = 4)
  plotfile <- tempfile(fileext = ".svg")
  svg(plotfile)
  image(t(mtx))
  dev.off()
  df <- data.frame(x = rep(1:3, each = 4),
                   y = rep(1:4, 3),
                   M = as.vector(mtx))

  before <- readLines(plotfile)
  annotate.analysis.page.svg(plotfile,
                             x = df$x,
                             y = df$y,
                             ids = paste0("R", 1:12))

  after <- readLines(plotfile)
  checkTrue(!identical(after, before))
}


test.double.annotation <- function()  {
  library(AnalysisPageServer)
  library(XML)
  library(RUnit)
  
  x <- seq(length = 20, 0, pi)
  y <- sin(x)
  z <- cos(x)
  n <- length(x)
  ids <- paste(sep="", "Reg", 1:n)
  ids2 <- paste(sep="", "Reg", 1:n + n)

  fn <- tempfile(fileext = ".svg")
  svg(fn, height = 4, width = 8)
  par(mfrow=c(1,2))
  plot(x,y, xlab = "theta", ylab = "Sine(theta)", pch = 19)
  plot(x,z, xlab = "theta", ylab = "Cos(theta)", pch = 19)
  dev.off()
  fn0 <- tempfile(fileext = ".svg")
  file.copy(fn, fn0)

  dfs <- list(data.frame(x = x, y = y, id = ids),
              data.frame(x = x, y = z, id = ids2))
  
  offset <- annotate.analysis.page.svg(fn,
                                       x = rep(x, 2),
                                       y = c(y,z),
                                       ids = c(ids,ids2))

  checkTrue(is.null(offset), "Can't annotate as a single block, return -1")
  checkEquals(length(grep("plot-point", readLines(fn))), 0, "Can't annotate as a single block, no \"plot-point\" found in SVG file")

  dies.ok(
          annotate.analysis.page.svg(fn,
                                     x = rep(x, 2),
                                     y = c(y,z),
                                     ids = c(ids,ids2),
                                     group.lengths = n)
          , "sum.group.lengths. = 20 but I am expecting 40")

  offset <- annotate.analysis.page.svg(fn,
                                       x = rep(x, 2),
                                       y = c(y,z),
                                       ids = c(ids,ids2),
                                       group.lengths = c(n,n))
  checkTrue(offset > 0, "some points were annotated (offset > 0)")


  get.pp <- function()  {
    pp.lines <- grep("plot-point", readLines(fn), val = TRUE)
    data.frame(t(sapply(lapply(pp.lines, xmlParse), xmlToList)), stringsAsFactors = FALSE)
  }
  got.pp <- get.pp()
  checkEquals(got.pp$id, c(ids,ids2))

  checkEquals(got.pp$class, rep("plot-point", 40))

  got.xy <- t(sapply(strsplit(sub(" C .*", "", sub("M ", "", got.pp$d)), " "), as.numeric))

  checkEquals(diag(cor(got.xy[1:n,], cbind(x,-y))),
              c(1,1),
              "first group correct")
  checkEquals(diag(cor(got.xy[n + 1:n,], cbind(x,-z))),
              c(1,1),
              "second group correct")


  ## check we can do repeated IDs---I don't see why we would not be able to.
  file.copy(fn0, fn)  ## reset the file to unannotated

  offset <- annotate.analysis.page.svg(fn,
                                       x = rep(x, 2),
                                       y = c(y,z),
                                       ids = c(ids,ids),  ## This is the difference from the last call: repeated ids instead of ids2
                                       group.lengths = c(n,n))
  got.pp <- get.pp()
  checkEquals(got.pp$id, c(ids, ids))
}


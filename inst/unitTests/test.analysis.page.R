test.analysis.page <- function()  {
  source(system.file("unitTests/shared.R", package = "AnalysisPageServer"))

  example(execute.handler, ask=FALSE)

  stopifnot(c("sine.data", "plot.file") %in% ls(.GlobalEnv))  # expecting example to create these two

  ## save these since we'll refer back to them later, when we test the max.regions parameter
  original.plot.file <- plot.file
  original.sine.data <- sine.data
  
  x <- seq(-2*pi, 2*pi, length=50)
  y <- sin(x)
  expected.data <- new("AnnotatedDataFrame",
                       data.frame(row.names=AnalysisPageServer:::make.standard.ids(50)))
  Biobase::varMetadata(expected.data) <- data.frame(labelDescription = character(),
                                                    type = character(),
                                                    stringsAsFactors=FALSE,
                                                    row.names = character())
                                                   
  ## need to be tolerant because the parameters are passed through JSON and get rounded.
  checkTrue(all.equal(sine.data$value$table,
                      new.datanode.table(name="table", data=expected.data), tolerance=1e-4),
            "expected data returned")

  if(platformIsWindows())  {
    message("Skipping plot check in test.analysis.page on windows")
  }  else  {
    svgdoc <- xmlParse(plot.file)
    pp <- safeGetPlotPoints(svgdoc)

    checkTrue(length(pp) == 50, "50 plot points found")

    attr <- sapply(pp, XML:::xmlAttrs)
    checkEquals(unname(attr["class",]), rep("plot-point",50), "plot-point attribute applied")
    checkEquals(unname(attr["id",]), Biobase::sampleNames(expected.data), "plot-point IDs correct")
  }

  ## Handler with no args does not cause an error
  set.seed(1)
  y <- sample(10)
  err <- try({
    handler <- new.analysis.page(function()  {plot(y); return(data.frame(row.names=LETTERS[1:10], x=1:10, y=y))})  
    adf <- AnalysisPageServer:::execute.handler(handler, params=list(), plot.file=plot.file)
  }, silent=TRUE)
  checkTrue(!is(err, "try-error"), "Handler with no args does not cause an error")

  ## Make a plot with no points---it should not cause an error
  err <- try({
    handler <- new.analysis.page(function()  {plot.new(); return(data.frame(x=numeric(0), y=numeric(0)))})
    adf <- AnalysisPageServer:::execute.handler(handler, params=list(), plot.file=plot.file)
  }, silent=TRUE)
  checkTrue(!is(err, "try-error"), "Handler with no points does not cause an error")


  ## A handler that doesn't plot---just return data, but format normally
  handler.noplot <- function() data.frame(foo=1:5, bar=5:1)
  
  ap <- new.analysis.page(handler.noplot, no.plot=TRUE, annotate.data.frame=TRUE)
  i.dev <- dev.cur()
  plot.file <- tempfile()
  retval <- AnalysisPageServer:::execute.handler(ap,
                                                 params=list(),
                                                 plot.file=plot.file)
  checkEquals(dev.cur(), i.dev, "no change in current plotting device")
  checkTrue(!file.exists(plot.file), "plot file not created")
  bare.retval <- handler.noplot()
  expected.adf <- AnalysisPageServer:::annotate.data.frame(bare.retval, required.fields=character(0))
  expected.retval <- new.datanode.table("table", expected.adf)
  checkEquals(retval,
              expected.retval,  "handler return value correct")



  ## Now we will test that when the number of points exceeds the max.annotated.regions parameter
  ## the calculation is still made, the data structure is still correct, the plot is still made,
  ## only difference is the plot doesn't get annotated. Eventually we also need to test that
  ## a warning is thrown.
  page <- new.analysis.page(AnalysisPageServer:::sine.handler)
  plot.file <- tempfile(fileext = ".svg")
  plist <- lapply(list(xmin=-2*pi, xmax=2*pi, n= 50), rjson::toJSON)
  got.sine.data <- AnalysisPageServer:::execute.handler(page, plist, plot.file=plot.file, max.annotated.regions = 20)

  ## We are expected a few differences in the data structure, so let's obliterate those and compare the rest
  ## First work on a copy of the reference data
  expected.sine.data <- original.sine.data
  ## Next, the name of the plotted file will be different.
  expected.sine.data$value$plot <- basename(plot.file)
  ## Next, the rows will not have been re-named in this version

  names(expected.sine.data$value$table$value$data) <- names(got.sine.data$value$table$value$data)
  
  checkEquals(got.sine.data, expected.sine.data)  
}


test.inject.file.params <- function()  {
  library(RUnit)
  library(AnalysisPageServer)
  .inject.file.params <- AnalysisPageServer:::.inject.file.params


  file1 <- list(foo= 1, bar = 2)
  file2 <- list(baz = 3, bazoo = 4)
  file3 <- list(jipi = "japa")
  fp <- list(F1 = file1, F2 = file2, F3 = file3)

  pars <- list(list(`___APS_fileContentId___` = "F1"),
               list(1,
                    list(foo = "bar",
                         bar = list(`___APS_fileContentId___` = "F2")),
                    list(`___APS_fileContentId___` = "invalidFID"),
                    LETTERS))

  

  exp <- pars
  exp[[1]] <- file1
  exp[[2]][[2]]$bar <- file2

  got <- .inject.file.params(pars, fp)
  checkEquals(got,
              list(exp, fp[3]))
}

test.prepare.params <- function()  {
  library(RUnit)
  library(AnalysisPageServer)


  # JSON Encode A List
  JEAL <- function(l)  lapply(l, rjson::toJSON)

  pp <- AnalysisPageServer:::.prepare.params

  j <- JEAL(list(width=10, height=7, foo=3, bar=NULL, baz=TRUE, xyz="napoleon"))
  checkEquals(pp(j),
              list(plot=list(width=10, height=7),
                   other=list(foo=3, bar=NULL, baz=TRUE, xyz="napoleon")),
              ".prepare.params: 2 PLOT, 4 other of numeric, NULL, logical and string")

  complex.list <- list(x=1:3, y=list(), z=list(A="foo", B=2:1))
  j <- JEAL(complex.list)
  got <- pp(j)
  checkEquals(got$other,
              complex.list,
              "complex list recovered")
  checkEquals(got$plot,
              list(A=1)[character(0)],  ## a way to make a 0-length named list
              "no PLOT params correct")

  # some file params (well, things that look like file params anyway)
  fp <- list(xy = list(name = "semicircle.xls",
               tmp_name = "/tmp/file1234"))

  got2 <- pp(j, fp)

  checkEquals(got2$plot,
              got$plot,
              "adding FILES param does not effect $plot part")

  checkEquals(got2$other,
              c(got$other, fp),
              "FILES param is passed through as-is, while others are still JSON decoded")



  pars <- list(foo = 1,
               bar = list(bar = 2,
                 baz = list(`___APS_fileContentId___` = "F1")),
               baz = list(`___APS_fileContentId___` = "F2"))
  parsWithFile <- JEAL(pars)
  filePars <- list(F1 = "file-1-structure",
                   F2 = "file-2-structure",
                   F3 = "file-3-structure")

  got <- pp(parsWithFile, filePars)
  exp <- pars
  exp$bar$baz <- filePars[[1]]
  exp$baz <- filePars[[2]]
  exp <- c(exp, filePars[3])
  checkEquals(got$other, exp)
}



test.annotate.data.frame <- function()  {
  library(AnalysisPageServer)

  annotate.data.frame <- AnalysisPageServer:::annotate.data.frame

  x <- data.frame(x=1:5,
                  y=1:5 + 0.1,
                  a = factor(LETTERS[5:1]),
                  b = c(T,F,T,T,F),
                  c = letters[1:5],
                  stringsAsFactors=FALSE)
  
  adf <- annotate.data.frame(x)

  checkEquals(Biobase::pData(adf), x, 'pData correct')

  checkEquals(Biobase::varMetadata(adf),
              data.frame(labelDescription=names(x),
                         type=c("integer","numeric","factor","logical","character"),
                         stringsAsFactors=FALSE,
                         row.names=names(x)),
              'varMetadata correct')
}



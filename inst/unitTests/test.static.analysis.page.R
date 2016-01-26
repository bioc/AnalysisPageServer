test.static.analysis.page <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  ## I'll make 4 datasets
  ## (1) Scatterplot (y=sin(x))
  ## (2) Barplot
  ## (3) Scatterplot with no data
  ## (4) Data with no plot

  plotfile <- function() tempfile(fileext=".svg")
  plot1 <- plotfile()
  mysvg <- function(...) svg(..., width=9, height=7)

  x <- 1:100 * pi /25
  y <- sin(x)
  labels <- rep(LETTERS, length = 100)
  df1 <- data.frame(x=x, y=y, Label = labels, theta = x, `sin(theta)` = y,
                    check.names = FALSE, stringsAsFactors = FALSE)
  mysvg(plot1)
  plot(x, y, xlab = expression(theta), ylab = expression(sin(theta)), pch = 19)
  dev.off()



  plot2 <- plotfile()
  mysvg(plot2)
  barplot(rbind(x,y), beside = TRUE,
          col = c("seagreen","skyblue"),
          border = "black",
          main = "Wavy Barplot") -> b
  dev.off()

  bars.x <- as.vector(b)
  bars.y <- rep(1, length(bars.x))  ## all bars start at baseline...I think!
  df2 <- data.frame(bars.x, bars.y,
                    Label = rep(df1$Label, each = 2),
                    type = rep(c("line","wave"), length = length(bars.x)),
                    theta = rep(x, each = 2),
                    `sin(theta)` = rep(y, each = 2),
                    check.names = FALSE,
                    stringsAsFactors = FALSE)


  outdir <- tempfile()

  ## I'll make 4 datasets:
  svg.files <- c(plot1, plot2, plot1, NA)
  dfs <- list(df1, df2, NULL, df1)
  titles <- c("Scattergram (y=sin(x))",
              "Barplot (x, sin(x)) pairs",
              "Scattergram again but with no data table",
              "Same data from scattergram but without plot")

  ds.offset <- AnalysisPageServer:::.dataset.offset$offset
  got <- static.analysis.page(outdir = outdir,
                              svg.files = svg.files,
                              dfs = dfs,
                              titles = titles,
                              verbose= TRUE)

  if(FALSE)  {
    ## Open it in your browser and mess around with it
    browseURL(got$URL)
  }
  
  exp.paths.list <- lapply(ds.offset + 1:4, function(i) {
    two.files <- list(plot = paste(sep = "", "data/dataset-", i, ".svg"),
                      data = paste(sep = "", "data/dataset-", i, ".json"))
    if(i == 4 + ds.offset)  two.files[-1]  else two.files
  })
  
  checkEquals(got$paths.list,
              exp.paths.list)
  
  expURL <- paste(sep = "",
                  if(platformIsWindows()) "file:///" else "file://",
                  normalizePath(outdir),
                  if(platformIsWindows()) "\\" else "/",
                  "analysis-page-server-static.html",
                  static.analysis.page.query.string(got$paths.list))

  checkEquals(got$URL, expURL)

  
  exp.data.files <- basename(unlist(exp.paths.list))
    
  checkEquals(sort(dir(file.path(outdir, "data"))),
              sort(exp.data.files))
  
  got <- rjson::fromJSON(readLines(file.path(outdir, exp.paths.list[[1]]$data)))
  got.row.names <- names(got$value$table$value$data)
  checkEquals(sub("Reg_.*_", "Reg", got.row.names),
              AnalysisPageServer:::make.standard.ids(100))

  
  if(Sys.getenv("ANALYSISPAGESERVER_FULL_TESTS") == 1)  {
    library(XML)
    xmlobj <- xmlToList(xmlParse(readLines(file.path(outdir, exp.paths.list[[2]]$plot))))

    xmlobjGG <- xmlobj$g$g
    got.pts <- do.call(rbind, xmlobjGG[names(xmlobjGG) == "path"])
    got.table <- rjson::fromJSON(readLines(file.path(outdir, exp.paths.list[[2]]$data)))
    got.row.names <- names(got.table$value$table$value$data)

    checkEquals(unname(got.pts[, "id"]),
                got.row.names)
    checkEquals(unname(got.pts[,"class"]),
                rep("plot-point", 200))
  }  else  {
    warning("Skipping check that plot was correctly annotated in test.static.analysis.page because ANALYSISPAGESERVER_FULL_TESTS is not set")
  }

}

test.valid.html4.ids <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  .valid.html4.ids <- AnalysisPageServer:::.valid.html4.ids
  checkTrue(all(.valid.html4.ids(c("foo", "fooFoo032:-.:-.__"))))

  checkTrue(all(! .valid.html4.ids(c(".foo", "", "1foo"))))
}


test.static.page.group.length.vec <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  ## I'll make 4 datasets
  ## (1) Scatterplot (y=sin(x))
  ## (2) Barplot
  ## (3) Scatterplot with no data
  ## (4) Data with no plot


  testdir <- system.file("testdata/static_example", package = "AnalysisPageServer")
  if(FALSE)  {
    library(ggplot2)
    testdir <- "/Users/friedmab/EP/AnalysisPageServer/inst/testdata/static_example"
    facet.plot <- file.path(testdir, "facet.plot.svg")
    svg(facet.plot, width = 7, height = 7)
    p <- ggplot(mtcars, aes(mpg, wt)) + geom_point()
    p + facet_grid(vs ~ am)
    dev.off()
  }
  
  groups <- unname(split(mtcars, list(mtcars$vs, mtcars$am)))
  group.lens <- vapply(groups, nrow, FUN.VALUE = 0)
  df <- do.call(rbind, groups)
  xy.fields <- c("mpg", "wt")
  df <- df[c(xy.fields, setdiff(names(df), xy.fields))]

  if(FALSE)  {
    ## This example is how to annotate it---but I'll save it unannotated
    fn <- tempfile(fileext=".svg")
    file.copy(facet.plot, fn)
    annotate.analysis.page.svg(svg.filename = fn,
                               x = df$mpg,
                               y = df$wt,
                               ids = rownames(mtcars),
                               group.lengths = group.lens)
  }

  facet.plot <- file.path(testdir, "facet.plot.svg")
  fn1 <- tempfile(fileext = ".svg")
  file.copy(facet.plot, fn1)

  df2 <- mtcars
  xy.fields <- c("disp", "hp")
  df2 <- df2[c(xy.fields, setdiff(names(df), xy.fields))]

  fn2 <- tempfile(fileext = ".svg")
  svg(fn2, width = 7, height = 7)
  plot(mtcars$disp, mtcars$hp, xlab = "disp", ylab = "hp", pch = 19, col = df2$carb)
  dev.off()

  titles <- c("wt versus mpg for different vs and am",
              "disp versus hp")
  outdir <- tempfile()
  got <- static.analysis.page(outdir = outdir,
                              svg.files = c(fn1, fn2),
                              dfs = list(df, df2),
                              titles = titles,
                              verbose= TRUE)
  if(FALSE)  {
    ## Open it in your browser and mess around with it
    ## The tagging will not have worked for the first (faceted) dataset
    cat(gsub("&", "&\n", sub("#", "#\n", got$URL)), "\n")
  }


  df$Car <- rownames(df)
  df2$Car <- rownames(df2)
  rownames(df) <- gsub(" ", "_", rownames(df))
  rownames(df2) <- gsub(" ", "_", rownames(df2))
  got <- static.analysis.page(outdir = tempfile(),
                              svg.files = c(fn1, fn2),
                              dfs = list(df, df2),
                              titles = titles,
                              show.xy = TRUE,
                              group.length.vecs = list(group.lens, NULL),
                              use.rownames.for.ids = TRUE,
                              verbose= TRUE)

  got <- static.analysis.page(outdir = tempfile(),
                              svg.files = fn1,
                              dfs = df,
                              group.length.vecs = group.lens)
                              
  
  
}


test.custom.html <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  ## I'll make 2 datasets
  ## (1) Scatterplot (y=sin(x))
  ## (2) Barplot

  plotfile <- function() tempfile(fileext=".svg")
  plot1 <- plotfile()
  mysvg <- function(...) svg(..., width=9, height=7)

  x <- 1:100 * pi /25
  y <- sin(x)
  labels <- rep(LETTERS, length = 100)
  df1 <- data.frame(x=x, y=y, Label = labels, theta = x, `sin(theta)` = y,
                    check.names = FALSE, stringsAsFactors = FALSE)
  mysvg(plot1)
  plot(x, y, xlab = expression(theta), ylab = expression(sin(theta)), pch = 19)
  dev.off()



  plot2 <- plotfile()
  mysvg(plot2)
  barplot(rbind(x,y), beside = TRUE,
          col = c("seagreen","skyblue"),
          border = "black",
          main = "Wavy Barplot") -> b
  dev.off()

  bars.x <- as.vector(b)
  bars.y <- rep(1, length(bars.x))  ## all bars start at baseline...I think!
  df2 <- data.frame(bars.x, bars.y,
                    Label = rep(df1$Label, each = 2),
                    type = rep(c("line","wave"), length = length(bars.x)),
                    theta = rep(x, each = 2),
                    `sin(theta)` = rep(y, each = 2),
                    check.names = FALSE,
                    stringsAsFactors = FALSE)

  
  titles <- c("Scattergram (y=sin(x))",
              "Barplot (x, sin(x)) pairs")

  dfs <- list(df1, df2)
  svg.files <- c(plot1, plot2)

  outdir <- tempfile()
  
  got <- static.analysis.page(outdir = outdir,
                              svg.files = svg.files,
                              dfs = dfs,
                              titles = titles,
                              verbose= TRUE)

  header.html <- custom.html.headers()
  div.style <- "border:1px solid black; width:800px; margin-left: auto; margin-right: auto"
  divs.html <- aps.dataset.divs(got$paths.list,
                                extra.div.attr = list(c(style=div.style)))

  html.lines <- c("<html>",
                  "<head>",
                  header.html,
                  "</head>",
                  custom.body.html(),
                  paste(divs.html, collapse= "\n<hr>\n\n"),
                  "</body>",
                  "</html>")
  index.html.path <- file.path(outdir, "index.html")
  writeLines(html.lines,
             index.html.path)
             
  if(FALSE)  {
    url <- sub("analysis-page-server-static.html.*", "index.html", got$URL)
    system(paste("open", url))
  }
  
}

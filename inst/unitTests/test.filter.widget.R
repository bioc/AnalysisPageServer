
## These 3 functions, .ignore.tags, .concat and ignore.lots.of.stuff
## are taken from the PlotTester package, but this has not (yet?)
## been released outside of Genentech, so I'm just copying them here.
.ignore.tags <- function(lines, tags)  {
  for(tag in tags)  {
    regex <- paste(sep="", " ", tag, "=\".*?\"")
    lines <- gsub(regex, "", lines)
  }
  return(lines)
}

.concat <- function(lines)  paste(collapse="", lines)

ignore.lots.of.stuff <- function(lines)  {
  one.line <- .concat(.ignore.tags(lines, c("id", "class", "type")))
  one.line <- gsub(">\\s+<", "><", one.line)
  return(one.line)
}


test.filter.widget <- function()  {
  library(AnalysisPageServer)
  library(RUnit)


  quadrant <- function(x, y)  {
    ifelse(abs(x - 0) < 1e-5 | abs(y - 0) < 1e-5, NA_character_,
           ifelse(x > 0,
                  ifelse(y > 0, "Q1", "Q2"),
                  ifelse(y < 0, "Q3", "Q4")))
  }
  color <- c(Q1 = "black",
             Q2 = "salmon",
             Q3 = "steelblue",
             Q4 = "seagreen")
  cells <- matrix(c("Q4", NA, "Q1",
                    NA, NA, NA,
                    "Q3", NA, "Q2"),
                  nrow = 3,
                  byrow = TRUE)

  handler <- function(n = 20)  {
    n <- 2 * ceiling(as.numeric(n)/2)
    theta <- (0:(n-1)) * pi / (n/2)
    x <- cos(theta)
    y <- sin(theta)

    quad <- quadrant(x,y)
    col <- color[quad]

    plot(x, y,
         pch = 19,
         col = adjustcolor(col, alpha.f = 0.7),
         axes = FALSE,
         xlab = "",
         ylab = "")

    for(qu in 1:4)  {
      Q <- paste0("Q", qu)
      qTheta <- pi/4 - (qu - 1) * pi /2
      labelX <- 1.3 * cos(qTheta)
      labelY <- 1.3 * sin(qTheta)
      text(labelX, labelY, Q, col = color[Q], cex = 2)
    }
    
    abline(h = 0, lty = "dashed")
    abline(v = 0, lty = "dashed")

    setFilterWidget(data.field = "quadrant",
                    color = color,
                    cells = cells)
    
    retval <- data.frame(x = x, y = y,
                         degrees = theta * 180 / pi,
                         quadrant = quad)

    retval <- retval[!is.na(col),]

    return(retval)
  }

  nParam <- slider.param(name = "n",
                         min = 8, max = 100, step = 4, value = 20)
  page <- new.analysis.page(handler = handler,
                            param.set = param.set(nParam),
                            name = "Quadrants")

  plot.file <- tempfile(fileext = ".svg")

  svg(plot.file)
  dataTable <- handler(60)
  dev.off()

  plotLines <- readLines(plot.file)
  
  got <- AnalysisPageServer:::execute.handler(page,
                                              params = list(n = "60"),
                                              plot.file = plot.file)

  checkEquals(ignore.lots.of.stuff(readLines(plot.file)),
              ignore.lots.of.stuff(plotLines),
              "plot same in handler() and execute.handler(...)")

  checkEquals(got$value$plot, basename(plot.file))

  
  expectedTable <- dataTable[3:length(dataTable)]
  rownames(expectedTable) <- paste0("Reg", 1:nrow(expectedTable))
  checkEquals(got$value$table$value$data,
              data.frame.to.list(expectedTable))
  checkEquals(got$value$filter_widget,
              new.filter.widget(data.field = "quadrant",
                                color = color,
                                cells = cells))
}

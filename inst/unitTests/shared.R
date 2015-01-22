library(AnalysisPageServer)
library(XML)
library(RUnit)

.dev.null <- if(platformIsWindows()) "NUL" else "/dev/null"

## this handles R3-type SVG docs as well as the older types
safeGetPlotPoints <- function(svgdoc)  {
  tryCatch(getPlotPoints(svgdoc),
           error = function(e)  {
             Filter(function(node)  {
               a <- xmlAttrs(node)
               "class" %in% names(a) && a[["class"]] == "plot-point"
             }, xmlChildren(xmlChildren(xmlChildren(svgdoc)[[1]])[[2]]))
           })
}


# return n x 2 matrix of x,y plot coordinates of points
# or special value NULL if it doesn't look like plot points (should have d tag starting with M)
get.plot.element.coords <- function(pp)  {
  pp.d <- sapply(pp, function(p) XML:::xmlAttrs(p)["d"])
  ## Do a string split
  pp.ss <- strsplit(pp.d, " ")
  
  ## First piece of the string should be M ("move to" in postscript, I think)
  ps.command <- sapply(pp.ss, "[", 1)
  if(any(is.na(ps.command) | ps.command != "M")) return(NULL)
  ## Now get the coodaintes of the points
  ## plot points in image coordinates
  t(sapply(lapply(pp.ss, "[", 2:3), as.numeric))
}




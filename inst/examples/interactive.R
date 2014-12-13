library(AnalysisPageServer)


plotter <- new.analysis.page(function(n=10)  {

  x <- y <- seq(-4*pi, 4*pi, len = 27)
  r <- sqrt(outer(x^2, y^2, "+"))
  image(z = z <- cos(r^2)*exp(-r/6), col  = gray((0:32)/32))

}, name = "plotter")



restart <- function()  {
  server$stop()
  app <- new.rook.analysis.page.server(reg,
                                       tmpdir = tempdir())
  

  server <<- Rook::Rhttpd$new()
  server$add(app, name = "APS")
  server$start(port=5002)
}



x <- 0:10
y <- (5-x)^2
z <- 10:0

plotter <- new.analysis.page(function(n=10)  {

  x <- y <- seq(-4*pi, 4*pi, len = 27)
  r <- sqrt(outer(x^2, y^2, "+"))
  image(z = z <- cos(r^2)*exp(-r/6), col  = gray((0:32)/32))

}, name = "plotter")

library(AnalysisPageServer)

hello <- build.service(function()  "Hello, world",
                       name = "hello")
          
reg <- new.registry(hello)


app <- new.rook.analysis.page.server(reg,
                                     tmpdir = tempdir())
  
server <- Rook::Rhttpd$new()
server$add(app, name = "APS")
server$start(port=5002)







restart <- function()  {
  server$stop()
  app <- new.rook.analysis.page.server(reg,
                                       tmpdir = tempdir())
  

  server <<- Rook::Rhttpd$new()
  server$add(app, name = "APS")
  server$start(port=5002)
}




sine <- build.service(function(theta)  sin(theta),
                      name = "sine")

random <- build.service(function(n)  rnorm(n),
                        name = "random")
          
reg <- new.registry(sine, random)
restart()


cx.return <- build.service(function()  {
  list(A = 1:5,
       B = "Able was I",
       C = list(x = 1, y = c(TRUE, FALSE, TRUE)))
}, name = "complex")



reg <- new.registry(cx.return)
restart()


cx.param <- build.service(function(struct, n)  {
  struct$A[n]
}, name = "cxpar")

reg <- new.registry(cx.param)

'
127.0.0.1:5002/custom/APS/R/analysis?page="cxpar"&struct={"A":[3,1,4,1,5,9,2,6,5,3]}&n=22

http://127.0.0.1:5002/custom/APS/R/analysis?page=%22cxpar%22&struct=%7B%22A%22:%5B3,1,4,1,5,9,2,6,5,3%5D%7D&n=2
'



arbitrary.response <- build.service(function()  {
  new.response("<p>The apparition of these faces in the crowd;</p>
<p>Petals on a wet, black bough.</p>",
               content.type = "text/html")
}, name = "poem")

reg <- new.registry(arbitrary.response)
restart()



plotter <- build.service(function(n)  {

  tf <- tempfile()
  png(tf)
  
  x <- y <- seq(-4*pi, 4*pi, len = 27)
  r <- sqrt(outer(x^2, y^2, "+"))
  image(z = z <- cos(r^2)*exp(-r/6), col  = gray((0:32)/32))

  dev.off()

  png.content <- readBin(tf, "raw", n = file.info(tf)[,"size"])
  unlink(tf)
  
  new.response(body = png.content,
               content.type = "image/png")
}, name = "plotter")

reg <- new.registry(plotter)
restart()

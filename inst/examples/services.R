library(AnalysisPageServer)

##################
## Hello World 
##

hello <- build.service(function()  "Hello, world",
                       name = "hello")

reg <- new.registry(hello)



restart <- function()  {
  try(server$stop())
  app <- new.rook.analysis.page.server(reg,
                                       tmpdir = tempdir())
  
  server <<- Rook::Rhttpd$new()
  server$add(app, name = "RAPS")
  server$start(port=5002)
}


restart()


'
http://127.0.0.1:5002/custom/RAPS/R/analysis?page="hello"
'









##################
## - Multiple "pages" (services) in one app
## - Vector return value 

sine <- build.service(function(theta)  sin(theta),
                      name = "sine")

random <- build.service(function(n)  rnorm(n),
                        name = "random")
          
reg <- new.registry(sine, random)
restart()


'
http://127.0.0.1:5002/custom/RAPS/R/pages?include_services=1

# sin(pi/6)
http://127.0.0.1:5002/custom/RAPS/R/analysis?page=%22sine%22&theta=0.5235988

http://127.0.0.1:5002/custom/RAPS/R/analysis?page="random"&n=10
# add zeros to see scaling in data transfer (in Safari so no cost to JSON rendering)
'




##################
## JSON encoding of complex return value
cx.return <- build.service(function()  {
  list(A = 1:5,
       B = "Able was I",
       C = list(x = 1, y = c(TRUE, FALSE, TRUE)))
}, name = "complex")



reg <- new.registry(cx.return)
restart()


'
http://127.0.0.1:5002/custom/RAPS/R/analysis?page="complex"
'


##################
## JSON decoding of complex parameter value

cx.param <- build.service(function(struct, n)  {
  ## In Javascript:
  ## struct["A"][n - 1]
  struct$A[n]
}, name = "cxpar")

reg <- new.registry(cx.param)
restart()
'
http://127.0.0.1:5002/custom/RAPS/R/analysis?page="cxpar"&struct={"A":[3,1,4,1,5,9,2,6,5,3]}&n=2

http://127.0.0.1:5002/custom/RAPS/R/analysis?page=%22cxpar%22&struct=%7B%22A%22:%5B3,1,4,1,5,9,2,6,5,3%5D%7D&n=2
'


##################
## Skipping JSON decoding of return value to have arbitrary response

arbitrary.response <- build.service(function()  {
  new.response("<p>The apparition of these faces in the crowd;</p>
<p>Petals on a wet, black bough.</p>",
               content.type = "text/html")
}, name = "poem")

reg <- new.registry(arbitrary.response)
restart()
'
http://127.0.0.1:5002/custom/RAPS/R/analysis?page="poem"
'



##################
## Returning an SVG

plotter <- build.service(function(n)  {

  tf <- tempfile()
  svg(tf)
  
  x <- y <- seq(-4*pi, 4*pi, len = n)
  r <- sqrt(outer(x^2, y^2, "+"))
  image(z = z <- cos(r^2)*exp(-r/6), col  = gray((0:32)/32))

  dev.off()

  svg.content <- readBin(tf, "raw", n = file.info(tf)[,"size"])
  unlink(tf)
  
  new.response(body = svg.content,
               content.type = "image/svg+xml")
}, name = "plotter")

reg <- new.registry(plotter)
restart()

'
http://127.0.0.1:5002/custom/RAPS/R/analysis?page="plotter"&n=40
'


########################
## GUI using AnalysisPage front end

IP <- build.service(client.ip, name = "IP")


## Differs from above:
## - constructor: new.analysis.page() instead of build.service()
## - No open/close graphics device
## - Returns empty data frame
plotter <- new.analysis.page(function(n = 10)  {

  x <- y <- seq(-4*pi, 4*pi, len = as.integer(n))
  r <- sqrt(outer(x^2, y^2, "+"))
  image(z = z <- cos(r^2)*exp(-r/6), col  = gray((0:32)/32))
  
  data.frame(x=numeric(), y= numeric())
},
                             name = "plotter")
#                             annotate.plot = FALSE)

reg <- new.registry(plotter, IP)
restart()

'

http://127.0.0.1:5002/custom/RAPS/backbone/expressionplot-app.html

'




########################
## Interactive graphics using AnalysisPage front end

head(iris)

iris.handler <- function(xfield = c("Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width"),
                         yfield = c("Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width"))  {
  xfield <- xfield[1]
  yfield <- yfield[1]
  plot(x <- jitter(iris[[xfield]]),
       y <- jitter(iris[[yfield]]),
       xlab = xfield,
       ylab = yfield,
       col = adjustcolor(as.integer(iris$Species), alpha.f = 0.7),
       pch = 19)

  xpd <- par(xpd = TRUE)
  legend("top",
         levels(iris$Species),
         pch = 19,
         col = 1:3,
         inset = -0.1,
         horiz = TRUE,
         bty = "n")
  par(xpd)
  
  data.frame(x = x, y = y, iris)
}

iris.page <- new.analysis.page(iris.handler, name = "iris")






reg <- new.registry(IP, plotter, iris.page)
restart()







####################################
## Comboboxes to populate dropdowns
##

cities <- list(CA = c("Los Angeles", "San Francisco", "San Diego"),
               MA = c("Boston", "Cambridge"),
               IL = c("Chicago", "Rockford", "Urbana"))

cities.for.state <- build.service(function(state)  cities[[state]],
                                  name = "cities")

reg <- new.registry(cities.for.state)
restart()

'
http://127.0.0.1:5002/custom/RAPS/R/analysis?page="cities"&state="CA"
'


state.param <- select.param(name = "state",
                            label = "State",
                            description = "Choose a State",
                            choices = names(cities))

city.param <- combobox.param(name = "city",
                             label = "City",
                             description = "Choose a city in that state",
                             uri = '/custom/RAPS/R/analysis?page="cities"&state=":state"',
                             dependent.params = c(state = "state"))


city.param.set <- param.set(state.param, city.param)


show.text <- function(text)  {
  plot(1,1,
       xaxt = "n",
       yaxt = "n",
       xlab = "",
       ylab = "",
       type = "n")
  text(1,1,
       text)
}

city.plot <- new.analysis.page(function(state = "CA", city = "San Francisco")  {
  show.text(sprintf("%s, %s\nA beautiful city", city, state))
  data.frame(x = numeric(), y = numeric())
},
                               param.set = city.param.set,
                               name = "city_plot")

reg <- new.registry(IP, cities.for.state, city.plot)
restart()


'
http://127.0.0.1:5002/custom/RAPS/backbone/expressionplot-app.html
'



#################################
## Persistent parameters
##



counties <- list(CA = c("San Francisco", "Marin", "Alameda"),
                 MA = c("Suffolk","Middlesex"),
                 IL = c("Cook", "Lake", "Champaign"))

counties.for.state <- build.service(function(state)  counties[[state]],
                                    name = "counties")


persistent.state.param <- select.param(name = "state",
                                       label = "State",
                                       description = "Choose a State",
                                       choices = names(cities),
                                       persistent = "state")
city.param.set.with.persistent.state <- param.set(persistent.state.param, city.param)
city.plot.with.persistent.state <- new.analysis.page(function(state = "CA", city = "San Francisco")  {
  show.text(sprintf("%s, %s\nA beautiful city", city, state))
  data.frame(x = numeric(), y = numeric())
},
                                                     param.set = city.param.set.with.persistent.state,
                                                     name = "city_plot")



county.param <- combobox.param(name = "county",
                               label = "County",
                               description = "Choose a county in that state",
                               uri = '/custom/RAPS/R/analysis?page="counties"&state=":state"',
                               dependent.params = c(state = "state"))

county.param.set <- param.set(persistent.state.param, county.param)

county.plot <- new.analysis.page(function(state = "CA", county = "San Francisco")  {
  show.text(sprintf("%s, %s\nA beautiful county", county, state))
  data.frame(x = numeric(), y = numeric())
},
                               param.set = county.param.set,
                               name = "county_plot")
reg <- new.registry(IP, cities.for.state, counties.for.state, city.plot.with.persistent.state, county.plot)
restart()

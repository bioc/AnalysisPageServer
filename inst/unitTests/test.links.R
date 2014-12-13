test.links <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  encode <- function(x) urlEncode(rjson::toJSON(x))

  checkEquals(analysis.page.link("pageName", submit = FALSE),
              "#page/pageName/primary",
              "empty params")

  checkEquals(analysis.page.link("pageName", params = list(), relative="http://foo/x"),
              "http://foo/x#page/pageName/analysis/%5B%5D",
              "absolute URL")
  

  checkEquals(analysis.page.link("pageName", params = list(foo=1)),
              paste(sep="", "#page/pageName/analysis/", encode(list(foo=1))),
              "non-empty params")



  dies.ok(analysis.page.link("pageName", params=list(foo=1), submit=FALSE))


  ## check that params are transformed by analysis page.
  ## real values are red/green/blue. Display values are "DisplayRed" etc.
  col.par <- select.param("color", choices=c(red="DisplayRed", green = "DisplayGreen", blue = "DisplayBlue"))
  page <- new.analysis.page(handler=identity,
                            name="colorpicker",
                            param.set=param.set(col.par),
                            skip.checks=TRUE)

  checkEquals(analysis.page.link("colorpicker", params=list(color="red")),
              paste(sep="", "#page/colorpicker/analysis/", encode(list(color="red"))))

  ## by contrast, using the AnalysisPageParam we get the correct special transformation of the labeled param
  checkEquals(analysis.page.link(page, params=list(color="red")),
              paste(sep="", "#page/colorpicker/analysis/", encode(list(color=list(v="red",r="red")))))

  ## we can explicitly specify the display value (although to be honest I'm not sure what the front-end
  ## does if you give an invalid display value!)
  checkEquals(analysis.page.link(page, params=list(color=c(red="DisplayRed"))),
              paste(sep="", "#page/colorpicker/analysis/", encode(list(color=list(v="red",r="DisplayRed")))))


  lives.ok(analysis.page.link("colorpicker", params=list(color="magenta")),
           "using character first arg means no argument checking")
  dies.ok(
          analysis.page.link(page, params=list(color="magenta"))
          , "value 'magenta' is not among choices",
          "AnalysisPageParam first arg validates parameters or dies")
           
}

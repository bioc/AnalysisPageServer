test.param.constructors <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  app <- "AnalysisPageParam"

    
  
  e <- list(name="xmin",
            label="X-min",
            description="Minimum x value",
            value="",
            type="text",
            advanced=0,
            show.if=NULL,
            size="medium",
            required=TRUE)
  class(e) <- app
  example(simple.param)
  checkIdentical(x, e, "simple.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(x)), "try-error"),
            "simple.param validates")


  e <- list(name="foo",
            label="foo",
            description="foo",
            value="",
            type="text",
            advanced=1,
            show.if=NULL,
            size="medium",
            required=TRUE)
  class(e) <- app
  got.advanced <- simple.param("foo", advanced=1)
  checkIdentical(got.advanced, e, "simple.param with advanced=1 works")

  e <- list(name="cov",
            label="Covariate Data",
            description="A two-column Excel file, first column being the sample ID (SAMID) and second being covariate data (with the name of the variable in the header)",
            value="",
            type="file",
            advanced=0,
            show.if=NULL,
            size="medium",
            required=TRUE)
  class(e) <- app
  example(file.param)
  checkIdentical(cov.param, e, "file.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(cov.param)), "try-error"),
            "file.param validates")
  
  

  err <- try(simple.param("x", size="foo"), silent=TRUE)
  checkTrue(is(err, "try-error") &&
            grepl("size 'foo' is not among known param sizes", as.character(err)),
            "unknown size throws error")

  ## check that unknown size throws error
  
  e <- list(name="show_ids",
            label="Show IDs",
            description="Show sample IDs on the plot",
            value=TRUE,
            type="bool",
            advanced=0,
            show.if=NULL,
            size="medium",
            required=TRUE)
  class(e) <- app
  example(bool.param)
  checkIdentical(show.ids, e, "bool.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(show.ids)),
                "try-error"),
            "bool.param validates")
  

  esl <- list(name = "children", label = "No. Children", description = "Number of Children", 
              value = 0, type = "slider", advanced = 0, show.if = NULL, 
              size = "medium", required = TRUE, min = 0, max = 10, step = 0.5)
  class(esl) <- app
  example(slider.param)
  checkEquals(slider, esl)
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(slider)),
                "try-error"),
            "slider.param validates")
  
  
  names(choices) <- choices <- c("red","green","mauve","tope")
  es <- list(name="color",
             label="Color",
             description="Color of your house",
             value="red",
             type="select",
             advanced=0,
             show.if=NULL,
             size="medium",
             required=TRUE,
             choices=choices,
             style = "dropdown",
             allow_multiple = FALSE)

  class(es) <- app
  example(select.param)
  checkIdentical(color, es, "select.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(color)), "try-error"),
            "select.param validates")

  ec <- list(name="gene",
             label="gene",
             description="gene",
             value="",
             type="combobox",
             advanced=0,
             show.if=NULL,
             size="medium",
             required=TRUE,
             uri="/find_gene_id/:genome/:query/",
             dependent=c(genome="genome", query="gene"),
             response.type="id-long_name-reason",
             prompt = "Enter search term",
             allow_multiple = FALSE,
             delay.ms = 0,
             n.param=NULL)
  class(ec) <- app
  example(combobox.param)
  checkEquals(gene, ec, "combobox.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(gene)), "try-error"),
            "combobox.param validates")

  ## Get the same call from the example
  cb.example <- parse(text=example(combobox.param, give.lines=TRUE))[[1]]
  ## Modify it a bit by adding a :num parameter
  cb.example[[3]]$n.param <- "num"
  cb.example[[3]]$uri <- paste(sep="", cb.example[[3]]$uri, ":num")
  ## And call it again.
  eval(cb.example)

  ## Modify the epxected value, too
  ec.with.num <- ec
  ec.with.num$uri <- paste(sep="", ec.with.num$uri, ":num")
  ec.with.num$n.param <- "num"
  checkIdentical(gene, ec.with.num, "combobox.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(gene)), "try-error"),
            "combobox.param validates")
  

  # Make sure some a mismatch between URI and dependent.params is caught
  ec$uri <- "/find_gene_id/:genomeX"
  got <- try(AnalysisPageServer:::.validate.param(ec),
             silent=TRUE)
  
  checkTrue(is(got, "try-error"),
            "combobox.param dies on URI/dep.pars mismatch")



  ecp <- list(name="comp",
              label="Comparison",
              description="Comparison",
              value="",
              type="compound",
              advanced=0,
              show.if=NULL,
              size="medium",
              required=TRUE)

  ecp$children <- param.set(lapply(c("study","comp","feature.type"), simple.param))
  ecp$children$feature.type$value <- "gene"
  class(ecp) <- app
  example(compound.param)
  checkIdentical(comp, ecp, "compound.param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(comp)), "try-error"),
            "compound.param validates")


  ea <- list(name="geneset",
             label="geneset",
             description="geneset",
             value="",
             type="array",
             advanced=0,
             show.if=NULL,
             size="medium",
             required=TRUE,
             prototype=simple.param(name="gene", label="Gene Symbol"),
             start=1,
             min=0,
             max=Inf)
  class(ea) <- app
  example(array.param)
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(gene.set)), "try-error"),
            "array.param validates")
  checkIdentical(gene.set, ea, "array.param")


}


test.default.params <- function()  {
  library(AnalysisPageServer)
  library(RUnit)


  ## Check the functions to build default AnalysisPageParam's for single parameters
  checkEquals(default.param("foo", 3),
              simple.param("foo", value=3),
              "default.param(3)")

  checkEquals(default.param("foo", 1:5),
              select.param("foo", choices=1:5),
              "default.param(1:5)")


  checkEquals(default.param("foo", as.list(1:5)),
              array.param("foo",
                          prototype=simple.param("foo", value=1),
                          start=5),
              "default.param(list(1,2,3,4,5))")

  checkEquals(default.param("foo", list(A=1, B=2)),
              compound.param("foo",
                             children=param.set(simple.param("A",value=1),
                               simple.param("B", value=2))),
              "default.param(list(A=1, B=2))")

  checkEquals(default.param("foo", NULL),
              simple.param("foo", value=NULL),
              "NULL becomes simple.param with NULL value")
  

  ## Now check the function to build default AnalysisPageParamSet for an entire function
  f <- function(A=1, B=2) {}
  example(default.param.set)
  checkIdentical(pset, param.set(list(simple.param("A", value=1),
                                      simple.param("B", value=2))), "default.param.set")


  ## check the parma.set function on an empty list
  expected <- list()
  class(expected) <- "AnalysisPageParamSet"
  for(got in list(param.set(), param.set(list())))
    checkIdentical(got, expected, "param.set on an empty list as expected")



  ## empty AnalysisPageParamSet validates
  empty.pset <- default.param.set(function(){})
  AnalysisPageServer:::.validate.paramset(empty.pset)
  
}


test.equal.params <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  dies.ok <- function(call, regex, name=regex)  {
    res <- try(eval(call), silent=TRUE)
    checkTrue(is(res, "try-error"), paste(name,":", "is try-error"))
    checkTrue(grepl(regex, conditionMessage(attr(res, "condition"))),
              paste(sep="", name," : matches /", regex, "/"))
  }

  lives.ok <- function(call, name=NULL)  {
    if(missing(name))  name <- paste(deparse(substitute(call)), "lives OK")
    res <- try(eval(call), silent=TRUE)
    if(is(res, "try-error")) cat(file=stderr(), "Error:", attr(res, "condition")$message, "\n")
    checkTrue(!is(res, "try-error"), paste(name, ": lives OK"))
  }

  p1 <- simple.param("foo")
  p2 <- simple.param("foo")
  b <- bool.param("bar")
  lives.ok(AnalysisPageServer:::.equal.param.type(p1, p2))

  dies.ok(AnalysisPageServer:::.equal.param.type(p1, b), "Different types")

  cp <- compound.param("baz", children=param.set(p1,b))
  cp2 <- compound.param("baz", children=param.set(p1, simple.param("bar")))

  dies.ok(AnalysisPageServer:::.equal.param.type(cp, cp2), "bar: Different types")
  cp2 <- compound.param("baz", children=param.set(p1, simple.param("baz")))

  dies.ok(AnalysisPageServer:::.equal.param.type(cp, cp2),
         "compound child params in .* but not .*")

  ap <- array.param("foo", prototype=p1)
  ap2 <- array.param("foo", prototype=p2)
  lives.ok(AnalysisPageServer:::.equal.param.type(ap, ap2))

  ap2 <- array.param("foo", prototype=b)
  dies.ok(AnalysisPageServer:::.equal.param.type(ap, ap2),
          "array.prototype: Different types:")
          
}



test.persistent.params <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  dies.ok <- function(call, regex, name=regex)  {
    res <- try(eval(call), silent=TRUE)
    checkTrue(is(res, "try-error"), paste(name,":", "is try-error"))
    checkTrue(grepl(regex, conditionMessage(attr(res, "condition"))),
              paste(sep="", name," : matches /", regex, "/"))
  }

  lives.ok <- function(call, name=NULL)  {
    if(missing(name))  name <- paste(deparse(substitute(call)), "lives OK")
    res <- try(eval(call), silent=TRUE)
    if(is(res, "try-error")) cat(file=stderr(), "Error:", attr(res, "condition")$message, "\n")
    checkTrue(!is(res, "try-error"), paste(name, ": lives OK"))
  }

  
  e <- simple.param("foo")
  prm.with.persist <- simple.param("foo", persistent = "Foo")
  stopifnot(!identical(prm.with.persist, e))
  e$persistent <- "Foo"
  checkIdentical(prm.with.persist, e, "persistent param")
  checkTrue(!is(try(AnalysisPageServer:::.validate.param(prm.with.persist)), "try-error"),
            "persistent simple.param validates")


  ## now make 3 AnalysisPageParamSet with some persistent params.
  fooP <- simple.param("foo", persistent ="foo")
  barP <- simple.param("bar", persistent ="bar")
  baz <- simple.param("baz")

  ps1 <- param.set(fooP, barP, baz)
  ps2 <- param.set(fooP, baz)
  ps3 <- param.set(baz)

  epp <- AnalysisPageServer:::.extract.persistent.params
  got <- epp(list(ps1, ps2, ps3))
  expected <- list()
  expected$bar <- list(barP)  ## bar first---because split() goes by alphabetical order, not by order of appearance
  expected$foo <- list(fooP, fooP)
  checkEquals(got, expected, 'extract.persistent.params correct')

  checkEquals(epp(list(ps3)), list(), 'extract.persistent.params returns empty list when there are no PPs')
  checkEquals(epp(list()), list(), 'extract.persistent.params returns empty list on empty paramset list')
  checkEquals(epp(list(param.set())), list(), 'extract.persistent.params returns empty list on list of empty paramset')

  vpp <- AnalysisPageServer:::.validate.persistent.params
  param.sets <- list(ps1, ps2, ps3)
  lives.ok(vpp(param.sets), 'param.sets validate their persistent params')
  lives.ok(vpp(list(ps3, ps3)), 'param.set with no persistent param validates')

  # now make a contradiction.  foo is supposed to be simple, make it a bool
  ps4 <- param.set(bool.param("foo", persistent="foo"))
  dies.ok(vpp(list(ps1, ps4)),
          "Persistent param 'foo' #2 differs from #1: Different types: text != bool")

  # double check -- it is based on the value of persistent, not of hte name of the par
  ps5 <- param.set(bool.param("bar", persistent="foo"))
  dies.ok(vpp(list(ps1, ps4)),
          "Persistent param 'foo' #2 differs from #1: Different types: text != bool")  
 
  
}

  
test.paramSetToJSON <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  
  ## make a complicated parameter with an transformer
  simpleFooPar <- simple.param("foo")
  fooPar <- simple.param("foo", transformer = as.numeric)

  ## verify that this cannot be directly JSON-encoded
  stopifnot(is(try(rjson::toJSON(param.set(fooPar)), silent = TRUE),
               "try-error"))

  checkEquals(paramSetToJSON(param.set(fooPar)),
              rjson::toJSON(param.set(simpleFooPar)),
              "transformer is silently removed --- paramToJSOn works for simple parameter")
  
  arrPar <- array.param("arr", prototype = fooPar)
  ## I'm not going to keep repeating the stopifnot assertion---you can test
  ## yourself, these things cannot be directly JSON encoded due to the transformer
  ## function.
  simpleArrPar <- array.param("arr", prototype = simpleFooPar)
  checkEquals(paramSetToJSON(param.set(arrPar)),
              rjson::toJSON(param.set(simpleArrPar)))


  cmpPar <- compound.param("cpd",
                           children = param.set(arrPar, fooPar))
  simpleCmpPar <- compound.param("cpd",
                                 children = param.set(simpleArrPar, simpleFooPar))
  checkEquals(paramSetToJSON(param.set(cmpPar)),
              rjson::toJSON(param.set(simpleCmpPar)))

  ## And finally put all the params together
  pset <- param.set(fooPar, arrPar, cmpPar)
  simplePset <- param.set(simpleFooPar, simpleArrPar, simpleCmpPar)
  checkEquals(paramSetToJSON(pset),
              rjson::toJSON(simplePset))
}

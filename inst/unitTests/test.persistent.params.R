
makePage <- function(name,
                     plainPars = character(0),
                     persPars = character(0),
                     persDep = list())  {
  
  parset <- do.call(param.set,
                    c(lapply(plainPars, simple.param),
                      lapply(names(persPars),
                             function(p) simple.param(p,
                                                      persistent = persPars[[p]],
                                                      persistent.dependencies = persDep[[p]]
                                                      )
                             )
                      )
                    )
  handler <- function() {}
  formals(handler) <- setNames(rep(list(NULL), length(parset)), names(parset))
  new.analysis.page(handler,
                    name = name,
                    param.set = parset,
                    skip.checks = TRUE)
}

makeReg <- function(...)  {
  do.call(new.registry, lapply(list(...), function(args) do.call(makePage, args)))
}

test.persistent.params <- function()  {
  library(AnalysisPageServer)
  library(RUnit)


  validate <- AnalysisPageServer:::.validate.registry
  
  
  emptyReg <- makeReg()
  checkEquals(persistent.params(emptyReg), character(0))
  lives.ok(
           validate(emptyReg)
           )

  regNoPers <- makeReg(list(name = "page1"))
  checkEquals(persistent.params(regNoPers), character(0))
  checkEquals(persistent.param.dependencies(regNoPers), list())
  lives.ok(
           validate(regNoPers)
           )


  ## In the next examples there are 2 pages, each has an "irrelevant" parameter
  ## "foo", and then persistent parameters study and color. 
  studyColorReg <- function(persDep1 = list(), persDep2 = list())  {
    reg <- makeReg(list(name = "page1",
                        plainPars = "foo",
                        persPars = c(study = "sharedStudy",
                          color = "sharedColor"),
                        persDep = persDep1),
                   list(name = "page2",
                        plainPars = "foo2",
                        persPars = c(study = "sharedStudy",
                          color = "sharedColor"),
                        persDep = persDep2))
    return(reg)
  }

  ## In this example study and color are independent
  regIndepPers <- studyColorReg()
  checkEquals(persistent.params(regIndepPers),
              c("sharedStudy", "sharedColor"))

  checkEquals(persistent.param.dependencies(regIndepPers),
              list(sharedStudy = character(0),
                   sharedColor = character(0)))


  lives.ok(
           validate(regIndepPers)
           )


  ## Now we'll make sharedColor dependent on sharedStudy. We'll make a few
  ## mistakes on the way, any make sure that they throw errors
  
  regDepPersInvalidPersDep <- studyColorReg(persDep1 = list(color = "wrongNameForStudy"))
  dies.ok(
          validate(regDepPersInvalidPersDep)
          , " error message here ")

  regDepPers <- studyColorReg(persDep1 = list(color = "study"))
  lives.ok(
           validate(regDepPers)
           )
  checkEquals(persistent.param.dependencies(regDepPers),
              list(sharedStudy = character(0),
                   sharedColor = "sharedStudy"))
  

  
  
}


test.validate.persistent.param.dependencies <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  .validate.registry <- AnalysisPageServer:::.validate.registry
  lives.ok(
           .validate.registry(makeReg())
           , "empty Registry validates")

  regNoPers <- makeReg(list(name = "page1"))
  lives.ok(
           .validate.registry(regNoPers)
           , "Registry with no persistent params validates")


  reg <- makeReg(list(name = "page1",
                      plainPars = "foo",
                      persPars = c(bar = "sharedBar")),
                 list(name = "page2",
                      plainPars = "foo",
                      persPars = c(bar = "sharedBar")),
                 list(name = "page3",
                      plainPars = "foo",
                      persPars = c(bar = "anotherSharedBar")))

  lives.ok(
           .validate.registry(reg)
           , "Registry with dependent non-combobox persistent params validates")
  

  ## Now we'll make a page with 2 params, the second of which is a combobox dependent
  ## on the first, and we'll (eventually) make them persistent
  make2parReg <- function(args1 = list(),
                          args2 = list())  {
    firstPar <- do.call(simple.param,
                        c(list("first"), args1))
    secondPar <- do.call(combobox.param,
                         c(list(name = "second",
                                uri = "/get?first=:first",
                                dependent.params = c(first = "first")),
                           args2))
    page <- new.analysis.page(function(first, second) {},
                              name = "page",
                              param.set = param.set(firstPar, secondPar),
                              skip.checks = TRUE)
    reg <- new.registry(page)
    return(reg)
  }
  
  lives.ok(
           .validate.registry(make2parReg())
           , "Registry with dependent combobox, non-persistent param, validates")

  ## Now we'll start to break it.
  reg <- make2parReg(args2 = list(persistent = "pSecond"))  # the p is for persistent

  dies.ok(
          .validate.registry(reg)
          ,
          "Parameter 'second' is dependent on non-persistent parameter.* first")

  ## OK now make first persistent too
  reg <- make2parReg(args1 = list(persistent = "pFirst"),
                     args2 = list(persistent = "pSecond"))
  lives.ok(
           .validate.registry(reg)
           , "persistent Dependent comobobox with *persistent* dependency validates")

  ## Now we'll try to break it by introducing a cycle. On the next page we'll have
  ## pFirst par depend on pSecond. This also tests that the real computation is
  ## happening in the persistent namespace, because we'll make the parameters have
  ## different page names.
  first2 <- simple.param(name = "first2",
                         persistent = "pFirst",
                         persistent.dependencies = "second2")
  second2 <- combobox.param(name = "second2",
                            uri = "/get?first=:first",
                            persistent = "pSecond",
                            dependent.params = character())
  page2 <- new.analysis.page(function(first2, second2) {},
                             name = "page2",
                             param.set = param.set(first2, second2),
                             skip.checks = TRUE)
  reg2 <- register.page(reg, "page2", page2)

  dies.ok(
          .validate.registry(reg2)
          , "dependencies have a cycle")

  
  
)}

test.registry <- function()  {
  library(RUnit)

  library(AnalysisPageServer)

  checkTrue(example(has.page.AnalysisPageRegistry, ask=FALSE)$value,
            "has.page finds the sine page after registration")
  checkTrue(!has.page(registry, "foobar"), "has.page returns false for non-existant page")

  
  expected.sine.ap <- new.analysis.page(AnalysisPageServer:::sine.handler, name="sine")
  checkIdentical(example(get.page.AnalysisPageRegistry, ask=FALSE)$value, expected.sine.ap, "get.page returns sine handler")
  
  checkIdentical(example(pages.AnalysisPageRegistry, ask=FALSE)$value, "sine", "pages() returns 'sine' as only registered handler")
  stopifnot("empty.pages" %in% ls(.GlobalEnv))   # expecting example(pages) to make an empty.pages variable
  checkIdentical(empty.pages, character(0), "pages() returns empty character vector on freshly minted registry")


  lives.ok({
    r <- AnalysisPageServer:::trig.registry()
    AnalysisPageServer:::.validate.registry(r)
    TRUE
  },
            "trig registry validates")
}

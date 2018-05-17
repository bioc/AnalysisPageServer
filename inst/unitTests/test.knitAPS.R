test.knitAPS <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  template.Rmd <- system.file("testdata", "knitAPS", "template.Rmd",
                              package = "AnalysisPageServer")

  td <- tempfile()
  
  if(FALSE)
    td <- tempfile(tmpdir = "~/htdocs/xxx")

  knitAPS(template.Rmd, td, e = list2env(list(passedVar = "foo")))

  ## Mostly this should be checked manually. Sorry. At least we know
  ## it runs to completion and I'll check for existance of some files
  checkTrue(file.exists(file.path(td, "template.html")),
            "rendered HTML file exists")
  checkTrue(file.exists(file.path(td, "AnalysisPageServer.css")),
            "AnalysisPageServer.css was copied")
}

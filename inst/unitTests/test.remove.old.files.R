test.remove.old.files <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  
  rof <- AnalysisPageServer:::remove.old.files


  td <- tempdir()

  unlink(file.path(td, dir(td)))
  
  ## Make one file every second for 6 seconds
  m <- 3
  n <- 2*m
  fns <- file.path(td,paste(sep=".", 1:6, "txt"))
  for(i in 1:n)  {
    Sys.sleep(1)
    writeLines("foo", fns[i])
  }

  before <- dir(td)
  
  ## And remove the oldest half of them.
  rof(td, m)

  after <- dir(td)

  deleted.files <- setdiff(before, after)

  ## We might have deleted one extra file depending on race condition
  checkTrue(length(deleted.files) %in% c(m, m + 1))
  checkEquals(deleted.files[1:m], paste(sep=".", 1:m, "txt"))
}

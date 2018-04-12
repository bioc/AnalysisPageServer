## some of these test tests are a bit counterintuititve.
## We are testing the test functions outside of the test framework.
## In that case they should just return TRUE on success or throw an exception on test failure.
## We aren't testing that the test names are passed through correctly---that would require
## some extra effort

## This gets us .dev.null, platform-independent /dev/null
source(system.file("unitTests/shared.R", package = "AnalysisPageServer"))


test.dies.ok <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  checkTrue(dies.ok(stop("error message"), "error"))

  got <- try(dies.ok(3), silent=TRUE)
  checkTrue(is(got, "try-error"),
            "dies.ok(3) fails dies")
  checkTrue(grepl("3 threw an error$", attr(got,"condition")$message),
            "dies.ok(3) throws '3 threw an error'")
}



## Now I can use dies.ok to test everything else!


test.lives.ok <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  checkEquals({lives.ok(3)}, 3, "{lives.ok(3)} passes lives OK and returns 3")


  sink(file=file(.dev.null,"w"), type="message")  ## lives.ok outputs the error message to STDERR when it does not live OK
  dies.ok({
    lives.ok(stop())
  }, "lives OK", "lives.ok(stop()) fails")
  sink(file=NULL, type="message")  ## restore STDERR

}






test.signal <- function()  {
  if(platformIsWindows())  {
    message("Skipping test.signal on windows")
    return()
  }

  library(AnalysisPageServer)
  library(RUnit)

  pid <- Sys.getpid()  

  got <- lives.ok(check.signal(tools::pskill(pid, tools::SIGUSR1),
                               signo = tools::SIGUSR1))

  ## Previously check.signal returned FALSE if the signal was successfully *sent*
  ## (even though it got *caught* by the receiving process [which happens to be
  ## the same as the *sending* process], it was still successfully *sent*).
  ## Turns out that this was an incorrect behavior, which has now been fixed.
  ## https://github.com/HenrikBengtsson/Wishlist-for-R/issues/62.
  ## I don't really care-- just testing that it got passed through. So I'll
  ## for TRUE or FALSE, so the test will path with both current and devel
  ## R versions.
  checkTrue(got %in% c(FALSE, TRUE), "pskill value returned")


  dies.ok(
          check.signal(NULL,
                       signo = tools::SIGUSR1)
          )


  lives.ok(check.signal(NULL,
                        signo = tools::SIGUSR1,
                        no.signal = TRUE))
  
  dies.ok(check.signal(tools::pskill(pid, tools::SIGUSR1),
                       signo = tools::SIGUSR1,
                       no.signal = TRUE))

}






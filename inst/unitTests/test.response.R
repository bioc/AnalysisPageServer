test.response <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  resp <- new.response("hello", "text/plain")
  expected <- list(body="hello", content.type="text/plain", status=200, headers=character())
  class(expected) <- "AnalysisPageResponse"
  checkEquals(resp, expected)
  lives.ok(
           AnalysisPageServer:::.validate.response(resp)
           , "valid response")
}

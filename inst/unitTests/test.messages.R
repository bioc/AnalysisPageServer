test.messages <- function()  {
  library(RUnit)
  library(AnalysisPageServer)

  ## We include the throwConditions option here
  ## so that we can call the handler with throwConditions = FALSE
  ## and then build the expected value from that, so we're just
  ## testing the add-on of the messages and warning, rather than
  ## the whole big returned data structure.
  handler <- function(n = 3, throwConditions = TRUE)  {
    
    if(throwConditions)
      message("Message 1")
    
    plot(1:n)
    
    if(throwConditions)  {
      message("Message 2")
      warning("uh, oh")
    }
    
    data.frame(x = 1:n, y = 1:n, i = 1:n)
  }

  ap <- new.analysis.page(handler)


  paramsWithConditions <- list(n = rjson::toJSON(5))
  paramsNoConditions <- c(paramsWithConditions, list(throwConditions = rjson::toJSON(FALSE)))
  
  gotNoConditions <- AnalysisPageServer:::execute.handler(ap,
                                                          params = paramsNoConditions,
                                                          plot.file = tempfile())


  got <- AnalysisPageServer:::execute.handler(ap,
                                              params = paramsWithConditions,
                                              plot.file = tempfile())
  

  

  expected <- gotNoConditions

  svg(tempfile())
  vwc <- tryKeepConditions(handler())
  dev.off()
  expected$warnings <- vwc.warnings(vwc)
  ## vwc.message(vwc) adds a "\n" at the end of the messages
  ## not sure why, but it's OK. But that's why I didn't just
  ## do
  ##    <- c("<li>Message 1</li>", ...)
  ## etc
  expected$custom$Messages <- paste0("<li>", vwc.messages(vwc), "</li>")

  ## don't compare $plot --- it will be different tempfiles
  expected$value$plot <- got$value$plot
  
  checkEquals(got, expected)
}

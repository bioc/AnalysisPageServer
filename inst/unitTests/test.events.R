test.events <- function()  {
  library(RUnit)


  r <- new.event.registry()

  dies.ok(
          add.event(3, "RingBell")
          , "is not an EventRegistry")
  
  add.event(r, "RingBell")
  add.event(r, "Bar")

  dies.ok(
          add.event(r, "Bar")
          , "already in registry")

  lives.ok(add.event(r, "Bar", overwrite=TRUE))
  
  
  checkEquals(event.names(r), c("RingBell", "Bar"))
  
  checkTrue(has.event(r, "RingBell"))
  checkTrue(!has.event(r, "Foo"))
  

  dies.ok(add.event.handler(r, "Baz", identity))
  
  
  bell.counter <<- 0
  on.exit(rm("bell.counter", pos = .GlobalEnv))
  add.event.handler(r, "RingBell", function()  cat("Ding Dong"))
  add.event.handler(r, "RingBell", function()  bell.counter <<- bell.counter + 1)


  output <- capture.output({
    got <- trigger.event(r, "RingBell")
  })

  checkEquals(got, 1)
  checkEquals(output, "Ding Dong")

  invisible(capture.output(trigger.event(r, "RingBell")))
  checkEquals(bell.counter, 2)

  clear.event.handlers(r, "RingBell")

  bc.before <- bell.counter
  output <- capture.output(got <- trigger.event(r, "RingBell"))
  checkEquals(got, NULL)
  checkEquals(bell.counter, bc.before, "Handlers not called after clearing event")
  checkEquals(output, character(), "Handlers not called after clearing event")

  dies.ok(
          trigger.event(r, "Baz")
          , "Registry does not have Event")
  
  
  
  ## Now add events to Bar to test the Catch functionality
  add.event.handler(r, "Bar", function(catch)  {
    retval <- 1
    attr(retval, "CatchEvent") <- catch
    return(retval)
  })
  add.event.handler(r, "Bar", function(catch) 2)

  checkEquals(trigger.event(r, "Bar", catch = FALSE), 2)
  checkEquals(trigger.event(r, "Bar", catch = TRUE), 1)
}


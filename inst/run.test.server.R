#!/usr/bin/env Rscript
library(AnalysisPageServer)
library(fork)


argv <- commandArgs(trailingOnly=TRUE)
if(length(argv) >= 1)  {
  port <- argv[1]
}  else  {
  port <- 3480
}

registry <- register.page(new.registry(), "sine",
                          AnalysisPageServer:::sine.handler)  
registry <- register.page(registry, "cosine",
                          AnalysisPageServer:::cosine.handler)  
app <- rook.app.from.registry(registry)
s <- Rhttpd$new()
app$add.to.server(s)

if(length(argv) >= 2)  {
  static.dir <- argv[2]
  file.exists(static.dir) || stop("static dir '", static.dir, "' does not exist")
  s$add(name="static",app=File$new(static.dir))
}

s$add(name="echo", app=function(env)  {
  req <- Request$new(env)
  res <- Response$new(status=200,
                      body=paste(sep="", "<pre>", capture.output(print(req$params())), "</pre>"))
  res$finish()
});


busy.ports <- readLines(pipe("netstat -nap tcp | grep LISTEN | perl -ne '@x = split /\\s+/, $_; ($x = $x[3]) =~ s/.*\\.//; print \"$x\\n\"' | sort | uniq"))
if(port %in% busy.ports)  stop("Port ", port, " is a already busy. Try a different port by supplying as first command line arg to run.test.server.R")

pid <- fork(function()  {
  s$start(port=port)
  Sys.sleep(100000)
})


Sys.sleep(0.5)  ## give a chance for server to start up, just so that the output is not mangeld
cat("Server started (pid=", pid, "). Press Ctrl-D to stop and quit.\n")
foo <- scan("stdin", 0,  n=1, quiet = TRUE) 
killall()

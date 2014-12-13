library(AnalysisPageServer)

app <- AnalysisPageServer:::rapache.trig.app()
app$add.handlers.to.global()

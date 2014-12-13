library(AnalysisPageServer)
reg <- AnalysisPageServer:::trig.registry()
app <- rapache.app.from.registry(reg,
                                 tmpdir = tempdir())
app$add.handlers.to.global()

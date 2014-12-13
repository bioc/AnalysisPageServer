test.search.replace <- function()  {
  library(AnalysisPageServer)
  library(RUnit)
  
  lines <- c("foo", "foo bar", "foo bar bazoo")
  tf1 <- tempfile()
  writeLines(lines, tf1)
  outfile <- tempfile()

  search.replace <- AnalysisPageServer:::search.replace

  search.replace(tf1, outfile,
                 replacements = c(foo = "XXX"))
  
  checkEquals(readLines(outfile),
              sub("foo", "XXX", lines))


  ## Check overwrite flag
  dies.ok(
          search.replace(tf1, outfile,
                         replacements = c(foo = "XXX", baz = "YYY"))
          )
  lives.ok(search.replace(tf1, outfile,
                          replacements = c(foo = "XXX", baz = "YYY"),
                          overwrite = TRUE))

  checkEquals(readLines(outfile),
              sub("baz", "YYY", sub("foo", "XXX", lines)))


  ## Check a quadruple substitution
  unlink(outfile)
  replacements <- c(foo = "XXX", bar = "YY", baz = "Z")
  search.replace(tf1, outfile,
                 replacements = replacements)
  got <- readLines(outfile)
  expected <- lines
  for(os in names(replacements))
    expected <- sub(os, replacements[os], expected)
  stopifnot( lines != expected )
  checkEquals(got, expected)
              
}

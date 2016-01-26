test.param.transformer <- function()  {
  library(AnalysisPageServer)
  library(RUnit)

  tpv <- AnalysisPageServer:::.transform.param.value
  checkEquals(tpv("foo", NULL),
              "foo",
              "No Param---no transformation")

  simple <- simple.param("simple")

  checkEquals(tpv("foo", simple),
              "foo",
              "No transformer---no transformation")


  ## verify that, without supplying a transformer
  ## the character "1" does not get transformed into
  ## the nubmer 1
  stopifnot(!identical(tpv("1", simple), 1))

  simpleNumeric <- simple.param("simple",
                                transformer = as.numeric)
  checkIdentical(tpv("1", simpleNumeric), 1)




  ## Now check that the two-argument version works
  parname <- "appender"
  appendParname <- simple.param(parname,
                                transformer = function(value, param)  {
                                  paste(value, param$name)
                                })

  checkEquals(tpv("the", appendParname), "the appender")




  ## Now we have to test the two types of complex parameters, array and compound.
  ## For both array and compound We'll build up to the test, and trying all combinations transformations on the
  ## children, the parent an both.

  ## Let's do array first

  ## First no transformations.
  words <- array.param("words", prototype = simple.param("word"))
  sentence <- "RNA splicing is very interesting."
  wordList <- as.list(strsplit(sentence, " ")[[1]])
  checkEquals(tpv(wordList, words), wordList)  ### no transformation

  ## Now trnasofmr the children from text to numbers
  numbers <- array.param("numbers",
                         prototype = simpleNumeric)
  primes <- c(2,3,5,7,11,13)
  primeText <- paste(primes, "")  ## this converts to text and adds a space
  stopifnot(primes !=  primeText)  ## they do not compare as equal

  primesList <- as.list(primes)
  primeTextList <- as.list(primeText)
  checkEquals(tpv(primeTextList, numbers),
              primesList)

  ## Now transform the list but not the children
  pastedWords <- array.param("pastedWords",
                             prototype = simple.param("word"),
                             transformer = function(words) paste(unlist(words), collapse= " "))
  checkEquals(tpv(wordList, pastedWords), sentence)

  ## Finally transform the children from text to numbers and transform the array to a single sum
  ## "summer" as in "one that sums", rather than the season.
  summer <- array.param("summer",
                        prototype = simpleNumeric,
                        transformer = function(numbers) sum(unlist(numbers)))
  checkEquals(tpv(primeTextList, summer), sum(primes))


  ## Now test compound param. It will have the summer array param in the middle
  ## flanked by two non-transformed params ("prefix" and "suffix"), and then it will paste them all togetehr
  ## into a "sentence".
  threeParams <- param.set(simple.param("prefix"), summer, simple.param("suffix"))
  concatenateList <- function(values)  paste(unlist(values), collapse = "")
  summerSentence <- compound.param("mixed",
                                   children = threeParams,
                                   transformer = concatenateList)

  value <- list(prefix = "The sum of your numbers is ",
                summer = primes,
                suffix = ". Isn't that great?")
  expectedSentence <- paste0("The sum of your numbers is ",
                             sum(primes), ". Isn't that great?")
  checkEquals(tpv(value,
                  summerSentence),
              expectedSentence)
              


  ## Awesome. Next we'll test that this is integrated correctly at the level of execute.handler
  ## We'll reuse the last example a bit
  page <- new.analysis.page(handler = function(...) paste(sep = "", ...),
                            name = "summerSentence",
                            param.set = threeParams,
                            skip.checks = TRUE,
                            no.plot = TRUE,
                            annotate.data.frame = FALSE)
  execute <- AnalysisPageServer:::execute.handler

  encodedParams <- lapply(value, rjson::toJSON)
  got <- execute(analysis.page = page,
                 params = encodedParams)
  checkEquals(got, expectedSentence)


  ## Finally let's add a paramset-level transformation. We'll swap the suffix and prefix.
  ## Also, to test that the transformer accepts the AnalysisPage object we'll concatenate
  ## the page name. It's going to be an ugly return value but it test the whole thing.
  page <- new.analysis.page(handler = function(...) paste(sep = "", ...),
                            name = "awfulSentence",
                            param.set = threeParams,
                            skip.checks = TRUE,
                            no.plot = TRUE,
                            annotate.data.frame = FALSE,
                            paramset.transformer = function(values, ap)  {
                              dummy <- values$suffix
                              values$suffix <- values$prefix
                              values$prefix <- paste(dummy, ap$name)
                              values
                            })

  got <- execute(analysis.page = page,
                 params = encodedParams)
  expectedAwfulSentence <- paste0(paste(value$suffix, page$name),
                                  sum(primes),
                                  value$prefix)
  ## In case you are wondering:
  ## > expectedAwfulSentence
  ## [1] ". Isn't that great? awfulSentence41The sum of your numbers is "

  checkEquals(got, expectedAwfulSentence)
  
  
}

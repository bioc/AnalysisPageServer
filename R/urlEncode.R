##' urlEncode all the strings in a character vector
##'
##' The urlEncode function supplied by RApache has a few behaviors I don't expect.
##' First, it requires only character arguments, so \code{urlEncode(1)} throws
##' an exception. Second, it dies on the empty string.
##'
##' This function is a wrapper for RApache's \code{urlEncode} that handles all
##' these cases. It might later be replaced with another implementation, but
##' the interface will stay. (The "aps" stands for \code{AnalysisPageServer}.)
##' @title aps.urlEncode
##' @param vec Vector to encode. Will be coerced to character.
##' @return charvec of same length, with encoded strings
##' @author Brad Friedman - Regular
##' @export
##' @examples
##'   aps.urlEncode(1)
##'   aps.urlEncode("")
##'   aps.urlEncode("foo/bar")
aps.urlEncode <- function(vec)  {
  vec <- sapply(vec, as.character)
  ## I used to have if(s == "")  but that results in an error when s is NA_character_
  encoded.vec <- sapply(vec, function(s)  if(identical(s, ""))  ""  else urlEncode(s))
  return(encoded.vec)
}

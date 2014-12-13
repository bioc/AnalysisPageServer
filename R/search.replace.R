##' Search and replace strings in a file
##'
##' This is a very limited interface and only meant for internal use.
##'
##' It will replace all occurances of a string with another string. It may
##' do 1 or 2 replacements.
##'
##' The result is written to a second file.
##'
##' This is done in C++ so very fast (I hope).
##' @title search.replace
##' @param infile Path to input file
##' @param outfile Path to output file (must be different)
##' @param replacements Named charvec of length 1 (single replacement) or 2 (double replacement)
##' @param overwrite Boolean. If FALSE then outfile must not yet exist. If TRUE and it
##' already exists then it will be overwritten.
##' @return Nothing, but might throw an error.
##' @author Brad Friedman
search.replace <- function(infile,
                           outfile,
                           replacements,
                           overwrite = FALSE)  {

  infile <- normalizePath(infile)
  
  stopifnot(length(infile) == 1)
  stopifnot(length(outfile) == 1)
  stopifnot(file.exists(infile))
  stopifnot(overwrite || !file.exists(outfile))
  stopifnot(file.exists(dirname(outfile)))

  stopifnot(is.character(replacements))
  stopifnot(!is.null(names(replacements)))

  err.mesg.buffer <- ""
  
  retval <- .C("searchReplaceFile",
               inFile = infile,
               outFile = outfile,
               oldStrs = names(replacements),
               newStrs = unname(replacements),
               nrep = length(replacements),
               err_mesg = err.mesg.buffer,
               PACKAGE = "AnalysisPageServer")
  
  if(err.mesg.buffer != "")  stop(err.mesg.buffer)
}




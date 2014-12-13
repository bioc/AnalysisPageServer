##' Annotate an AnalysisPage SVG plot
##'
##' The plot points are found by looking for a sequence of points whose x and y
##' coordinates correlation >= 0.999 with the query x and y vectors.
##'
##' Then each is tagged with class.name, and with the corresponding ID from the vector.
##'
##' The file is overwritten.
##' @title annotate.analysis.page.svg
##' @param svg.filename Path to SVG file
##' @param x Vector of x values
##' @param y Vector of y values (same length as x)
##' @param ids Vector of ids (same length as x)
##' @param group.lengths Positive integer vector summing to \code{x} (an ordered partition of \code{length(x)})
##' giving length of contiguous groups of elements. Each integer must be at least 3. The search will be for
##' contiguous elements, then continue where the last one left off, possibly after a gap. Default: \code{length(x)},
##' look for a single contiguous block.
##' @param class.name Class name to apply to points (default: "plot-point")
##' @param start This is a 0-based integer. It is an offset of where to start
##' looking for the plot elements. Default is 0, to start at the beginning. The meaning
##' of the index after that is not exposed to the interface, however this function returns numbers that
##' you can then use to "continue looking where you left off".
##' @param uniquify.ids.suffix NULL or a string. If NULL then do not modify the
##' identifiers in the SVG file. If a string, then call \code{\link{uniquify.ids.in.svg.files}}
##' to modify the "glyph" and "clip" identifiers, using this word as the \code{suffixes} parameter).
##' @param verbose Logical. Default, FALSE. Passed through (as integer) to C++
##' @return Integer, the "next start" position, or where to start looking to continue after this
##' stretch. (Invisibly). If no match was found then returns NULL.
##' @author Brad Friedman
##' @export
annotate.analysis.page.svg <- function(svg.filename,
                                       x,
                                       y,
                                       ids,
                                       group.lengths = length(x),
                                       class.name = "plot-point",
                                       start = 0,
                                       uniquify.ids.suffix = NULL,
                                       verbose = FALSE)  {

  n <- length(x)
  stopifnot(length(y) == n)
  stopifnot(length(ids) == n)
  is.character(ids) || stop("ids is not character: ", paste(collapse= " ", is(ids)))
  stopifnot(is.null(uniquify.ids.suffix) || (is.character(uniquify.ids.suffix) || length(uniquify.ids.suffix) == 1))
  x <- as.double(x)
  y <- as.double(y)
  if(any(is.na(x)) | any(is.na(y)))
    stop("x or y has NA values---this should be omitted from the table before annotating the plot")
  
  err.mesg.buffer <- ""

  sum(group.lengths) == n || stop("sum(group.lengths) = ", sum(group.lengths), " but I am expecting ", n)
  all(group.lengths >= 3) || stop("group.lengths must all be >= 3")

  for(i.gp in 1:length(group.lengths))  {
    ## these are indices into x, y and ids
    gp.len <- group.lengths[i.gp]
    start.idx <- if(i.gp == 1) 1 else sum(group.lengths[1:(i.gp-1)]) + 1
    end.idx <- start.idx + gp.len - 1
    idx <- start.idx:end.idx
    x.run <- as.double(x[idx])
    y.run <- as.double(y[idx])
    ids.run <- ids[idx]
    
    retval <- .C("annotateAnalysisPageSVG",
                 svg_filename = normalizePath(svg.filename),
                 n_elements = as.integer(gp.len),
                 x = x.run,
                 y = y.run,
                 ids = ids.run,
                 class_name = class.name,
                 err_mesg = err.mesg.buffer,
                 start = as.integer(start),
                 verbose = as.integer(verbose),
                 PACKAGE="AnalysisPageServer")
    
    if(err.mesg.buffer != "")  stop(err.mesg.buffer)
    if(retval$start == -1)  {
      start <- NULL
      break
    }
    start <- retval$start + gp.len
  }

  if(!is.null(uniquify.ids.suffix))
    uniquify.ids.in.svg.files(svg.filenames = svg.filename,
                              suffixes = uniquify.ids.suffix)

  invisible(start)
}



.default.uniquify.ids.prefixes <- list(glyph = c(' id="', 'xlink:href="#'),
                                       clip = c(' clip-path="url(#', '<clippath id="', '<clipPath id="'))

##' Uniquify IDs in a set of SVG filename
##'
##' The SVG files made by R use identifiers like "glyph1-3", "glyph1-4" etc.
##' In particular these are used to define paths for different characters
##' in order to render text. Also there are "clip1", "clip2" etc which represent
##' clip paths, which I think limits the viewable area in a layer of a plot,
##' but whatever it is looks awful if it goes wrong.
##'
##' If multiple SVG files are embedded in the same page then this is a big
##' problem because they will all share the same namespace and may
##' grab the paths defined in a different file.
##'
##' This function will process a set of SVG files replacing each word "glyph"
##' with a file-specfic suffix like "glyph_123_", and each word "clip"
##' with "clip_123_" You can provide the
##' suffixes explicitly or let this function generate some random words,
##' one for each file.
##'
##' This function does search-and-replace with these two cleverness-es:
##' \enumerate{
##'   \item{It uses C++ so it is faster (I hope) than calling \code{gsub}.}
##'   \item{It checks the context of the words "glyph" and "clip", so if you had an SVG
##'         containing that word other than identifier it should be preserved. This
##'         is not 100\% bulletproof since it doesn't actually parse the SVG
##'         file but it should be 99.99\% bulletproof, unless you go out
##'         of your way to break it.}
##' }
##' 
##' @title uniquify.ids.in.svg.files
##' @param svg.filenames Paths to SVG files
##' @param suffixes Charvec. Suffixes to add to IDs, corresponding
##' to \code{svg.filenames}.
##' These is added after the word "glyph" and before the next character.
##' An underscore character is added on both sides, too, to separate
##' your suffix visually from the word "glyph" and the numbers after it.
##' Ignored if \code{new.glyph.word} is provided.
##' @param prefixes Named list. The names are the tokens that need to be
##' replaced, such as "glyph" and "path". The values are charvec of prefixes.
##' Only when those words appear after one of their prefixes is it
##' substituted. Default is taken from
##' \code{AnalysisPageServer:::.default.uniquify.ids.prefixes}.
##' @return Nothing, modifies SVG file in place.
##' @author Brad Friedman
##' @note Typical (and recommended) usage is to only provide the \code{svg.filenames}
##' argument and leave the rest as defaults.
##' @export
##' @examples
##' svg.filenames <- sapply(1:2, function(i)  {
##'   fn <- tempfile(fileext = ".svg")
##'   svg(fn)
##'   plot(1:10, main = paste("Plot", i), col = i)
##'   dev.off()
##'   fn
##' })
##' grep("glyph", readLines(svg.filenames[1]), value = TRUE)
##' uniquify.ids.in.svg.files(svg.filenames)
##' grep("glyph", readLines(svg.filenames[1]), value = TRUE)
uniquify.ids.in.svg.files <- function(svg.filenames,
                                      suffixes = unique.words(length(svg.filenames)),
                                      prefixes = .default.uniquify.ids.prefixes)  {

  stopifnot(file.exists(svg.filenames))
  n.files <- length(svg.filenames)
  stopifnot(length(suffixes) == n.files)

  stopifnot(is.list(prefixes))
  stopifnot(!is.null(names(prefixes)))
  stopifnot(sapply(prefixes, is.character))
  stopifnot(sapply(prefixes, is.vector))
  stopifnot(table(names(prefixes)) == 1)
  
  stopifnot(!any(duplicated(suffixes)))

  names(tokens) <- tokens <- names(prefixes)
  
  make.strs <- function(suffix)
    unlist(lapply(tokens, function(token)  paste(sep="", prefixes[[token]], token, suffix)))

  oldStrs <- make.strs("")
  
  for(i.file in 1:n.files)  {
    flanked.suffix <- paste0("_", suffixes[i.file], "_")
    newStrs <- make.strs(flanked.suffix)
    replacements <- setNames(newStrs, oldStrs)

    new.file <- tempfile()
    svg.filename <- svg.filenames[i.file]
    search.replace(svg.filename,
                   new.file,
                   replacements = replacements)
    ## we do file.copy and then unlink instead of file.move, because file.move
    ## cannot move across filesystems.
    file.copy(new.file, svg.filename, overwrite = TRUE) || stop("Error copying new SVG '",
                                        new.file, "' to '", svg.filename, "'")
    unlink(new.file)
  }
}


unique.words <- function(n.words,
                         word.length = 6,
                         word.alphabet = c(LETTERS, letters, 0:9))  {
  
  words <- character()
  needed.words <- n.words
  
  while(needed.words > 0)  {
    new.words <- replicate(n.words,
                           paste(collapse="", sample(word.alphabet, word.length, replace = TRUE)))
    words <- setdiff(unique(c(words, new.words)), .APSEnv$random.words)
    needed.words <- n.words - length(words)
  }

  ## Don't use these random words ever again (at least not in this R session)
  .APSEnv$random.words <- c(.APSEnv$random.words, words)
  return(words)
}

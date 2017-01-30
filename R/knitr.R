
##' Set up knitr documents to contain AnalysisPageServer data sets
##'
##' If you want to embed APS data sets within a knitr document
##' then this function should be called at the top of the document
##' like this:
##'
##' \code{
##'   ```{r echo = FALSE}
##'   AnalysisPageServer::setup.knitr()
##'   ```
##' }
##'
##' Calling this function has the following effects:
##'
##' \enumerate{
##'   \item{
##'     The first effect is a heinous crime. It
##'     looks up the call stack to see if you are in the middle of a
##'     \code{\link[tools]{buildVignettes}} call. If so then it sets
##'     \code{clean = FALSE} for that call. The reason for this is that
##'     for the document to work it will need a bunch of auxiliary files
##'     like .css and .js, and if \code{clean = TRUE} then these files
##'     won't be left and your data sets will not show at all. During
##'     R CMD build \code{buildVignettes} is explicitly called with
##'     \code{clean = TRUE} so this is the only way I could figure out
##'     how to turn it off. If it can't find \code{buildVignettes} in the
##'     call stack then nothing special happens. This would be the case
##'     if you are just calling \code{\link[knitr]{knit2html}} yourself.
##'   }
##'
##'   \item{
##'     The next effect is to copy all the front end files to
##'     the output directory. The default output directory is also kind
##'     of heinous. The files need to be next to the output file. So the
##'     function again looks up the call stack to find the \code{knit2html}
##'     call, then grabs the name of the \code{output} file from there and uses
##'     its directory as \code{outdir}. If it can't find a \code{knit2html}
##'     call then it throws an error.
##'   
##'     The output directory is saved with a call to the private function
##'     \code{\link{set.APS.outdir}}. This is then read back by \code{\link{embed.APS.dataset}}
##'     so that the data sets get written to the write place. You could add
##'     a \code{\link{reset.APS.outdir}()} call in a chunk at the bottom of your knitr document.
##'   }
##'
##'   \item{
##'     Any files in \code{include.css} are copied to the output directory and
##'     included as CSS. The default is a default stylesheet that will make
##'     your reports look like the vignettes.
##'   }
##' }
##' 
##' Finally it returns the html headers as a "knit_asis" object
##' to be included in your document. See \code{\link{custom.html.headers}}.
##'
##' @return HTML headers as \code{knit_asis} objects.
##' @author Brad Friedman
##' @param outdir Output directory to which front end files should be written.
##' Default: see details.
##' @param include.css Paths to CSS files to include. See details.
##' @param include.toc Boolean, default TRUE. Should I include a table of contents?
##' @param libbase.prefix Passed to \code{\link{custom.html.headers}}. Default:
##' \code{\link{get.APS.libbase.prefix}()}.
##' @param quiet Boolean, default TRUE. Set to FALSE to turn on some diagnostic
##' messages
##' @export
##' @examples
##' message("See vignette embedding.html")
setup.APS.knitr <- function(outdir,
                            include.css = system.file("AnalysisPageServer.css", package = "AnalysisPageServer"),
                            include.toc = TRUE,
                            libbase.prefix = get.APS.libbase.prefix(),
                            quiet = TRUE)  {
  find.call <- function(pattern) Position(function(x) grepl(paste0(pattern, "$"), as.character(x)[1]), sys.calls())
  
  bv.pos <- find.call("buildVignettes")
  if(!is.na(bv.pos))  {
    if(!quiet) message("Setting clean=FALSE in buildVignettes frame")
    assign("clean", FALSE, envir = sys.frame(bv.pos))
  }

  k2h.pos <- find.call("knit2html")
  if(is.na(k2h.pos))  {
    if(!quiet) message("Couldn't find knit2html() in the call stack, using outdir = \".\"")
    outdir <- "."
  }  else  {
    outfile <- sys.frame(k2h.pos)$output
    if(is.null(outfile))  {
      if(!quiet) message("knitr outfile is not set, so trying to use infile instead")
      infile <- sys.frame(k2h.pos)$input
      stopifnot(!is.null(infile))
      outdir <- dirname(infile)
    }  else  {
      outdir <- dirname(outfile)
    }
  }
  
  if(!quiet) message("knit2html outdir='", outdir, "'")
  file.exists(outdir) || stop("outdir '", outdir, "' does not exist")

  set.APS.outdir(outdir)

  if(libbase.prefix == "")  {
    if(!quiet) message("libbase.prefix == \"\" so now copying front-end files")
    invisible(copy.front.end(outdir = outdir, overwrite = TRUE, include.landing.page = FALSE))
  }
  
  if(include.toc)
    options(markdown.HTML.options = "toc")

  for(css.file in include.css)
    file.copy(css.file, outdir, overwrite = TRUE) || stop("Couldn't copy CSS file '", css.file, "' to '", outdir, "'")

  css.headers <- sprintf('<link rel="stylesheet" type="text/css" href="%s" />', basename(include.css))

  html <- paste(collapse = "\n",
                c(custom.html.headers(libbase.prefix = libbase.prefix),
                  css.headers))
  knitr::asis_output(html)
}

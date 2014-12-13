
.urlEncode <- function(x)  {
  ss <- strsplit(x, "")
  encoded.chars <- lapply(ss, sapply, function(ch) if(grepl("^[A-Za-z0-9_]$", ch)) ch else paste(sep="", "%", toupper(as.character(charToRaw(ch)))))
  encoded.strings <- sapply(encoded.chars, paste, collapse="")
  return(encoded.strings)
}


.urlDecode <- function(x)  {
  x <- gsub("\\+", " ", x)  ## substitute + -> " "
  decoded <- sapply(x, function(x1)  {
    left <- ""
    loop.failsafe <- 0
    while(TRUE)  {
      loop.failsafe <- loop.failsafe + 1
      stopifnot(loop.failsafe <= 10000)
      match <- regexpr("%[A-Fa-f0-9]{2}", x1)
      if(match == -1)  {
        left <- paste(sep="", left, x1)
        break
      }

      code <- strsplit(toupper(substr(x1, match+1, match+2)), "")[[1]]
      ints <- sapply(code, function(hexchar)  if(hexchar < "A")  {
        as.integer(charToRaw(hexchar)) - as.integer(charToRaw("0"))
      }  else  {
        as.integer(charToRaw(hexchar)) - as.integer(charToRaw("A")) + 10
      })
      val <- ints[1] * 16 + ints[2]
      char <- rawToChar(as.raw(val))
      
      left <- paste(sep="",
                    left,
                    substr(x1, 1, match-1),
                    char)
      x1 <- substr(x1, match+3, nchar(x1))
    }
    
    return(left)
  })
  
  names(decoded) <- names(x)

  return(decoded)
}

##' urlEncode a string
##'
##' When a function of this name is available from the global environment
##' (such as when running under RApache) then that function is used.
##' Otherwise a pure R implementation is provided.
##' @name urlEncode
##' @param x Character vector of strings to urlEncode
##' @return Character vector of same length as \code{x} containing
##' encoded strings
##' @author Brad Friedman
##' @export
if(exists("urlEncode", mode = "function"))  {
  message("While loading AnalysisPageServer: urlEncode found, not providing a new one")
  urlEncode <- get("urlEncode", mode = "function")
}  else  {
  message("While loading AnalysisPageServer: urlEncode not found, providing a pure R implementation")
  urlEncode <- .urlEncode
}


##' urlDecode a string
##'
##' When a function of this name is available from the global environment
##' (such as when running under RApache) then that function is used.
##' Otherwise a pure R implementation is provided.
##' @name urlDecode
##' @param x Character vector of strings to urlDecode
##' @return Character vector of same length as \code{x} containing
##' decoded strings
##' @author Brad Friedman
##' @export
if(exists("urlDecode", mode = "function"))  {
  message("While loading AnalysisPageServer: urlDecode found, not providing a new one")
  urlDecode <- get("urlDecode", mode = "function")
}  else  {
  message("While loading AnalysisPageServer: urlDecode not found, providing a pure R implementation")
  urlDecode <- .urlDecode
}




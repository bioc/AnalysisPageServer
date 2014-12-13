##' Return client IP address
##'
##' This is the "X-Forwarded-For" header, if available, and otherwise the "remote_ip" component of the global SERVER variable
##' @title client.ip
##' @return \code{SERVER$remote_ip}
##' @author Brad Friedman
##' @examples
##' SERVER <<- list(remote_ip = "127.0.0.1")
##' client.ip()
##' @export
client.ip <- function()  {
  shi <- SERVER$headers_in
  if(!is.null(shi))  {
    xff <- shi$`X-Forwarded-For`
    if(!is.null(xff))  return(xff)
  }
  return(SERVER$remote_ip)
}


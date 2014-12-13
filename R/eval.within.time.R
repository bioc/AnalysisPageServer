##' Evaluate an R expression in a fork within a given time frame
##'
##' The expression is evaluated in a child process while the
##' parent process waits up to the given time interval. If the child
##' process finishes quickly enough it will signal to the parent process to wake up
##' and return a particular value. If the time interval elapses before
##' the child process finishes then the parent wakes up anyway and kills
##' the child, then throws an error. (You may want to wrap this function
##' in a \code{tryCatch} block to handle the error gracefully.)
##'
##' The implementation uses the \code{fork} package, which is loaded---an
##' error is thrown if unavailable. In fact, the parent sleeps for short
##' intervals (controlled by \code{dsecs} param), each time waking up to
##' check if either the time has elapsed or the child has finished, then
##' acting accordingly.
##'
##' The way the child signals to the parent is via the filesystem. There are
##' two such files: the result file and the signal file. The child writes
##' the result of the calculation to disk as a serialized R object. Usually
##' you should try to keep this small. Then the child touches a second
##' file, called the "signal" file, which signals that it is finished.
##' Both of these are temporary files. While in loop, the parent checks for
##' existence of the signal file. After exiting the loop, the parent reads
##' the result file. An attempt is made to delete both files before
##' returning or throwing an error.
##'
##' The child process evalutes your expression within a try block. If this
##' evaluation results in an error, then the captured error object is
##' passed to the parent, which then throws it again.
##'
##' It is possible that the child would *start* writing the result but not
##' finish before the time elapses. That would be considered a timeout. The
##' thing which the parent checks is if the signal file exists.
##'
##' Don't be intimidated by the large number of arguments. Typically
##' usage involves only the first two.
##' @title eval.within.time
##' @param expr Expression to evaluate
##' @param secs Seconds to timeout. Example: 10. Ignored if \code{time} is
##' provied.
##' @param dsecs Seconds for parent process to sleep between checking
##' the child process. It will be recycled to length 2. The first interval
##' will be the first element, then each time it will wait twice as long
##' until the interval is at least as long as the second element, then
##' it will wait the second elemtn. This keep the ratio of time required
##' to run and time actually taken to run close to 1 without having excessive
##' checking for longer processes.
##' Default: c(0.001, 0.1) (seconds).
##' @param time \code{difftime} object giving the timeout interval.
##' Default: \code{as.difftime(secs, units = "secs")}, which simply
##' means to build a \code{difftime} object from the \code{secs} argument.
##' If this argument is provided then \code{secs} is ignored.
##' @param verbose Boolean, default FALSE. If TRUE then emit messages
##' with process IDs, etc.
##' @param write.obj Function to serialize and write the resulting R object to
##' the connection. First argument is the object and second is the connection.
##' Default: \code{saveRDS}.
##' @param read.obj Function to read and deserialize the resulting R object from
##' the connection. Argument is the connection. Default: \code{readRDS}.
##' @param make.con A function to make the connection for communication
##' between child and parent. The function will be called once with
##' no arguments. The child will then write to it with saveRDS and the
##' parent will read from it with readRDS. Default: \code{tempfile}.
##' @param cleanup.con A function to clean up a conncetion. Default:
##' \code{function(con) if(file.exists(con)) unlink(con)}.
##' @param touch.con A function to "touch" a connection. Default:
##' \code{function(con) writeLines(character(), con)}. This is used
##' to signal through the signal file.
##' @param con.touched A predicate to check if the connection has been touched.
##' Default: \code{file.exists}.
##' @param make.signal.con Same as \code{make.con}, but for the signal file.
##' Default: \code{make.con}.
##' @param cleanup.signal.con Like \code{cleanup.con}, but for the signal file.
##' Default: \code{cleanup.con}.
##' @return The result of evaluating \code{expr}
##' @author Brad Friedman
##' @export
eval.within.time <- function(expr, secs,
                             dsecs = c(0.001, 0.1),
                             time = as.difftime(secs, units = "secs"),
                             verbose = FALSE,
                             write.obj = saveRDS,
                             read.obj = readRDS,
                             make.con = tempfile,
                             cleanup.con = function(con) if(file.exists(con)) unlink(con),
                             touch.con = function(con) writeLines(character(), con),
                             con.touched = file.exists,
                             make.signal.con = make.con,
                             cleanup.signal.con = cleanup.con)  {
                             
  require(fork) || stop("fork not available")

  ## The expression will be evaluated in the child
  ## The parent will wait for it to finish and
  ## harvest the result

  ## This file will hold the result
  res.con <- make.con()
  
  ## Then child will create this to signal that the
  ## the result is finished.
  signal.con <- make.signal.con()

  ## This connection, if touched, indicates that an error was thrown
  error.con <- make.signal.con()
  
  if(verbose)  {
    message("eval.within.time: resfile = '", as.character(res.con), "'")
    message("eval.within.time: signal.file = '", as.character(signal.con), "'")
  }
  
  child <- function()  {
    if(verbose)  message("eval.within.time child: starting")
    error.thrown <- FALSE
    res <- tryCatch(eval(expr), error = function(e)  {
      error.thrown <<- TRUE
      return(e)
    })
    if(verbose)  message("eval.within.time child: finished calculation")
    write.obj(res, res.con)
    if(verbose)  message("eval.within.time child: finished serializing result")
    touch.con(signal.con)
    if(error.thrown)
      touch.con(error.con)
    if(verbose)  message("eval.within.time child: finished")
  }

  
  if(verbose)  message("eval.within.time: forking")
  pid <- fork::fork(child)

  if(verbose)  message("eval.within.time parent: forked pid=", pid)

  dsecs <- rep(dsecs, length = 2)
  wait.sec <- dsecs[[1]]
  
  t0 <- Sys.time()
  dt <- Sys.time() - t0
  while(!con.touched(signal.con)  &&
        dt <= time)  {
    if(verbose)  message("eval.within.time parent: waiting...", as.numeric(dt), " ", units(dt))
    Sys.sleep(min(wait.sec, dsecs[2]))
    dt <- Sys.time() - t0
    if(wait.sec < dsecs[2])
      wait.sec <- wait.sec * 2
  }
  
  if(!con.touched(signal.con))  {
    if(verbose)  message("eval.within.time parent: timeout. Killing child pid=", pid)
    cleanup.con(res.con)
    fork::kill(pid)
    fork::wait(pid)
    stop("Timeout after ", as.numeric(time), " ", units(time))
  }

  fork::wait(pid)

  if(verbose)  message("eval.within.time parent: Child finished. Reading result")
  
  res <- readRDS(res.con)

  error.thrown <- con.touched(error.con)
  
  if(verbose)  message("eval.within.time parent: Cleaning up")

  cleanup.con(res.con)
  cleanup.signal.con(signal.con)
  cleanup.signal.con(error.con)

  if(error.thrown)  {
    if(verbose)  message("eval.within.time parent: Throwing error")
    stop(res)
  }

  if(verbose)  message("eval.within.time parent: Returning")
  return(res)
}

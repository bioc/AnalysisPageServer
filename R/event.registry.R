##' EventRegistry constructor
##'
##' An EventRegistry is a collection of Events. Each Event has a name
##' and a list of functions, each known as a handler.
##' Events can be modified or triggered. When triggered, each function
##' is called in turn, and the final return value is returned to the triggering context.
##' 
##' @title new.event.registry
##' @return EventRegistry
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
new.event.registry <- function()  {
  e <- new.env(parent = emptyenv())
  e$e <- list()
  class(e) <- "EventRegistry"
  return(e)
}


.event.registry.or.die <- function(registry)  {
  is(registry, "EventRegistry") || stop("registry is not an EventRegistry: ",
                                        paste(collapse=" ", is(registry)))
}

##' Get vector of names of all existing Events.
##'
##' Get vector of names of all existing Events.
##' @title event.names
##' @param registry EventRegistry
##' @return Charvec
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
##' event.names(r)
##' add.event(r, "mouseclick")
##' event.names(r)
event.names <- function(registry)  {
  .event.registry.or.die(registry)
  return(names(registry$e))
}

##' Predicate to test if an EventRegistry has an Event of a given name
##'
##' Predicate to test if an EventRegistry has an Event of a given name
##' @title has.event
##' @param registry EventRegistry
##' @param event String. Name of the Event.
##' @return Logical
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
##' has.event(r, "mouseclick")
##' add.event(r, "mouseclick")
##' has.event(r, "mouseclick")
has.event <- function(registry, event)  {
  event %in% event.names(registry)
}

##' Add a new event to a registry
##'
##' Add a new event to a registry. If an Event of that name already
##' exists then if \code{overwrite} is not set then an error is thrown, and
##' if \code{overwrite} is set then the contents of the old Event are simply replaced.
##' Use \code{add.handler} to add a handler to an existing Event.
##' @title add.event
##' @param registry EventRegistry
##' @param event String. Name for the Event.
##' @param overwrite Logical. If the Event already exists, should I overwrite it? If TRUE
##' then yes, without warning. If FALSE (default) then no, throw an error.
##' @return Nothing good.
##' @author Brad Friedman
##' @importFrom stats setNames
##' @export
##' @examples
##' r <- new.event.registry()
##' has.event(r, "mouseclick")
##' add.event(r, "mouseclick")
##' has.event(r, "mouseclick")
add.event <- function(registry, event,
                      overwrite = FALSE)  {
  
  if(event %in% event.names(registry))  {
    overwrite || stop("Event '", event, "' already in registry and overwrite is not set")
    clear.event.handlers(registry, event)
  }  else  {
    registry$e <- c(registry$e, setNames(list(handlers=list()), event))
  }
}


##' Add a Handler to an Event
##'
##' A Handler is any function to be called when the event is triggered.
##' If the return value of the Handler has a "CatchEvent" attribute which is TRUE then the
##' event will be caught and not bubble to the next handler, and the "CatchEvent" attribute
##' will be stripped before returning the value to the triggering context.
##'
##' If the Event does not yet exist an error is thrown.
##' @title add.event.handler
##' @param registry EventRegistry
##' @param event String. Name of the Event
##' @param handler Function. The new Handler to add to the Event.
##' @return Nothing good.
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
##' add.event(r, "mouseclick")
##' add.event.handler(r, "mouseclick", function(x, y)  message("Mouse clicked at coordinates (", x, ", ", y, ")"))
##' trigger.event(r, "mouseclick", x = 30, y = 50)
add.event.handler <- function(registry, event, handler)  {
  has.event(registry, event) || stop("Registry does not have Event '", event, "': ",
                                     paste(collapse=" ", event.names(registry)))

  stopifnot(is.character(event))
  stopifnot(is.function(handler))

  registry$e[[event]]$handlers <- c(registry$e[[event]]$handlers,
                                    list(handler))
}

##' Clear the Handlers list for one Event
##'
##' Clear the Handlers list for one Event. Does not remove the Event from the EventRegistry.
##' @title clear.event.handlers
##' @param registry EventRegistry
##' @param event String. Name of the Event.
##' @return Nothing good.
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
##' add.event(r, "mouseclick")
##' add.event.handler(r, "mouseclick", function(x, y)  message("Mouse clicked at coordinates (", x, ", ", y, ")"))
##' trigger.event(r, "mouseclick", x = 30, y = 50)
##' clear.event.handlers(r, "mouseclick")
##' trigger.event(r, "mouseclick", x = 30, y = 50)
clear.event.handlers <- function(registry, event)  {
  has.event(registry, event) || stop("Registry does not have Event '", event, "': ",
                                     paste(collapse=" ", event.names(registry)))

  registry$e[[event]]$handlers <- list()
}

##' Remove an Event entirely
##'
##' Remove an Event entirely from the EventRegistry. Contrast with \code{\link{clear.event.handlers}},
##' which only removes the handlers for that event.
##' @title remove.event
##' @param registry EventRegistry
##' @param event String. Name of the Event to remove
##' @return Nothing good.
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
##' add.event(r, "mouseclick")
##' has.event(r, "mouseclick")
##' remove.event(r, "mouseclick")
##' has.event(r, "mouseclick")
remove.event <- function(registry, event)  {
  .event.registry.or.die(registry)

  registry$e[[event]] <- NULL
}

##' Trigger a registered Event
##'
##' Trigger a registered Event.
##' 
##' Every handler is called in turn. If any handler returns a value with a "CatchEvent"
##' attribute set to TRUE then no further handlers are called. That attribute is removed
##' from the return value and the value is returned to the triggering context. Otherwise
##' the return value of only the last function is called.
##'
##' If no handlers are registered then NULL is returned.
##'
##' If no Event exists of that name then an error is thrown.
##' @title trigger.event
##' @param registry EventRegistry
##' @param event Name of event to trigger
##' @param ... Further parameters are passed to each handler in turn.
##' @return See Details
##' @author Brad Friedman
##' @export
##' @examples
##' r <- new.event.registry()
##' add.event(r, "mouseclick")
##' add.event.handler(r, "mouseclick", function(x, y)  message("Mouse clicked at coordinates (", x, ", ", y, ")"))
##' trigger.event(r, "mouseclick", x = 30, y = 50)
trigger.event <- function(registry, event, ...)  {
  has.event(registry, event) || stop("Registry does not have Event '", event, "': ",
                                     paste(collapse=" ", event.names(registry)))

  val <- NULL
  
  for(h in registry$e[[event]]$handlers)  {
    val <- h(...)
    if(isTRUE(attr(val, "CatchEvent")))  {
      ## catch the event, do not call the other handlers
      attr(val, "CatchEvent") <- NULL
      return(val)
    }
  }

  return(val)
}

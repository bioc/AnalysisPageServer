#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <R.h>

int caught = 0;
int caught_signo = 0;

void sig_handler(int signo)  {
  caught = 1;
  caught_signo = signo;
}


void R_reset_handler()  {
  caught_signo = caught = 0;
}


void R_start_catching(int *signo)  {
  if(signal(*signo, sig_handler) == SIG_ERR)  {
    error("Error registering handler for signal %d\n", *signo);
  }
  R_reset_handler();
}

void R_stop_catching(int *signo)  {
  if(signal(*signo, SIG_DFL) == SIG_ERR)  {
    error("Error unregistering handler for signal %d\n", *signo);
  }
}

void R_last_catch(int *last_caught, int *last_caught_signo)  {
  *last_caught = caught;
  *last_caught_signo = caught_signo;
  R_reset_handler();
}

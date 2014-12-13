#ifndef __CATCH_INCLUDED
#define __CATCH_INCLUDED
using namespace std;

/* These have to be visible from R_init_AnalysisPageServer, so we include them here */

void R_start_catching(int *signo);
void R_stop_catching(int *signo);
void R_last_catch(int *last_caught, int *last_caught_signo);

#endif

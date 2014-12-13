#include <R_ext/Rdynload.h>
#include "AnalysisPageSVG.h"
#include "SearchReplace2.h"

extern "C" {
  #include "catch.h"
}

#define CMETHOD_DEF(fun, numArgs) {#fun, (DL_FUNC) &fun, numArgs}

static const R_CMethodDef cMethods[] = {
  CMETHOD_DEF(annotateAnalysisPageSVG, 9),
  CMETHOD_DEF(searchReplaceFile, 6),
  CMETHOD_DEF(R_start_catching, 1),
  CMETHOD_DEF(R_stop_catching, 1),
  CMETHOD_DEF(R_last_catch, 2),
  {NULL, NULL, 0}
};


extern "C"  {
  void R_init_AnalysisPageServer(DllInfo *info)  {
    R_registerRoutines(info, cMethods, NULL, NULL, NULL);
    return;
  }
}


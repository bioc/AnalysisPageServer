#ifndef __ANALYSISPAGESVG_INCLUDED
#define __ANALYSISPAGESVG_INCLUDED

#include "tinyxml2.h"
#include <vector>
#include <deque>
using namespace std;
using namespace tinyxml2;

typedef vector<XMLElement*> XMLElementList;
typedef vector<XMLElement*>::iterator XMLElementListIterator;
typedef pair<double,double> XYCoords;


XYCoords  plotElementCoords(const XMLElement *e);

XMLElementList getPlotElements(XMLDocument* doc,
			       int verbose = 0);

int num_children(XMLElement* e);

// You give me a list of all the plot elements.
// I return start of match, or els.end().
// If start > 0 then I start looking there and no earlier.
// I return the index (based at 0, even if start > 0) of the beginning of the first match,
// or -1 if no match
int matchPlotPoints(XMLElementList els,
		    deque<double> x,
		    deque<double> y,
		    double min_cor = 0.999,
		    int start = 0,
		    int verbose = 0);


// I add ID and class tags to the first element and its next (n-1) siblings.
// An error if I run out of elements to tag. If you supply ids non-NULL then
// I will use them (without checking bounds). Otherwise construct from start_id
// and id_prefix
void tagPlotElements(XMLElementListIterator first,
		     int n,
		     char **ids = NULL,
		     const char *class_name = "plot-point",
		     int verbose = 0);



void summarize_element(XMLElement *el, const char *title);


/* This has to be visible from R_init_AnalysisPageServer, so we include it here */
extern "C" {
  void annotateAnalysisPageSVG(char **svg_filename,
			       int *n_elements,
			       double *x,
			       double *y,
			       char **ids,
			       char **class_name,
			       char **err_mesg,
			       int *start,
			       int *verbose);
}


#endif

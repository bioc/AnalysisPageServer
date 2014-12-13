#include "tinyxml2.h"
#include <cstdlib>
#include <iostream>
#include <vector>
#include <deque>
#include <sstream>
#include <string>
#include "cor.h"
#include "AnalysisPageSVG.h"
#include <iterator>
#include <R.h>

using namespace tinyxml2;
using namespace std;

void summarize_element(XMLElement *el, const char *title)  {
  const char *d = el->Attribute("d");
  const char *cl = el->Attribute("class");
  const char *id = el->Attribute("id");

  REprintf("C++ annotateAnalysisPageSVG: %s\n   name = %s\n",
           title, el->Name());

  REprintf("      d = ");
  if(d != NULL)  REprintf("%s", d);
  REprintf("\n");

  REprintf("      cl = ");
  if(cl != NULL)  REprintf("%s", cl);
  REprintf("\n");

  REprintf("      id = ");
  if(id != NULL)  REprintf("%s", id);
  REprintf("\n");
}



XYCoords plotElementCoords(const XMLElement *e)  {
  const char *cp = e->Attribute("d");
  if(cp == NULL)  throw "No 'd' attribute";
  
  string d(cp);

  if(string(d, 0, 2) != "M ")  throw "d does not start with \"M \"";

  string::size_type space2 = d.find(' ', 2);
  if(space2 == d.size())  throw("d does not have second space");
  
  string::size_type space3 = d.find(' ', space2+1);
  // ok for space 3 to be end of string

  string xs(d, 2, space2-2);
  string ys(d, space2+1, space3 - space2 - 1);

  double x, y;
  istringstream(xs) >> x;
  istringstream(ys) >> y;

  return XYCoords(x,y);
}




// Extract list of all potential plot elements as they occur in order.
// These are all the path children of /svg/g/ and /svg/g/g[@clip-path].
XMLElementList getPlotElements(XMLDocument* doc,
				     int verbose)  {

  if(verbose)  REprintf("getPlotElements() starting\n");

  XMLElementList plot_elements;

  
  XMLElement* svg_el = doc->FirstChildElement("svg");
  
  if(svg_el == NULL)  {
    if(verbose)  REprintf("getPlotElements(): document did not have <svg> element\n");
    return(plot_elements);
  }

  XMLElement* g1_el = svg_el->FirstChildElement("g");

  int i = 0;
  while(g1_el != NULL)  {
    if(verbose)  REprintf("getPlotElements(): Examining <g>[%d]\n", i);

    XMLElement *el2 = g1_el->FirstChildElement();
    
    int j = 0;

    while(el2 != NULL)  {
      if(!strcmp(el2->Value(), "g"))  {
	if(el2->Attribute("clip-path") != NULL)  {
	  if(verbose)
            REprintf("getPlotElements(): <g>[%d][%d] has clip-path attribute...saving path elements\n",
	             i, j);
	  XMLElement *path = el2->FirstChildElement("path");
	  int k = 0;
	  while(path != NULL)  {
	    plot_elements.push_back(path);
	    path = path->NextSiblingElement("path");
	    k++;
	  }
	  if(verbose)
            REprintf("getPlotElements(): <g>[%d][%d] has clip-path attribute ... saved %d elements\n",
	             i, j, k);
	}  else  {
	  if(verbose)
            REprintf("getPlotElements(): <g>[%d][%d] has no clip-path attribute...skipping\n",
	             i, j);
	}
      }  else if(!strcmp(el2->Value(), "path"))  {
	// The element itself is a path...save it
        if(verbose)
          REprintf("getPlotElements(): <g>[%d][%d] is a <path>...saving\n",
                   i, j);
	plot_elements.push_back(el2);
      }
      el2 = el2->NextSiblingElement();
      j++;
    }

    g1_el = g1_el->NextSiblingElement("g");
    i++;
  }

  if(verbose)  REprintf("getPlotElements() returning %d plot elements\n", plot_elements.size());

  return(plot_elements);
}


int num_children(XMLElement* e)  {
  XMLElement* e2 = e->FirstChildElement();
  int n = 0;
  while(e2 != NULL)  {
    n++;
    e2 = e2->NextSiblingElement();
  }
  return(n);
}



int matchPlotPoints(XMLElementList els,
		    deque<double> x,
		    deque<double> y,
		    double min_cor,
		    int start,
		    int verbose)  {
  int n = x.size();
  if(n != y.size())  throw "x and y have different lengths";


  if(els.size() < start + n)  {
    if(verbose)
      REprintf("matchPlotPoints(): Not enough elements. els.size()=%d < start(%d) + n(%d) = %d\n",
               els.size(), start, n, start + n);
    return(-1);
  }
  

  // Use deque instead of vector to get const time deletion at the beginning, too.
  // These will alway hold current stretch of points we are considering
  deque<double> els_x;
  deque<double> els_y;

  if(verbose)
    REprintf("matchPlotPoints() looking for %d plot points\n", n);

  // Set up els_x and els_y. We'll keep iterators to the beginning and end 
  // (Actually one-past the end) of the range
  XMLElementListIterator first = els.begin() + start;
  XMLElementListIterator last = first + n;  // actually one-past theend
  for(XMLElementListIterator i = first; i != last; i++)  {
    if(verbose)  {
      REprintf("matchPlotPoints(): considering plot element %d as follows:\n", i - els.begin());
      summarize_element(*i, "plot element");
    }
      
    XYCoords xy = plotElementCoords(*i);
    els_x.push_back(xy.first);
    // y coordinate must be negated to convert from device to user directionality
    els_y.push_back(-xy.second);
  }

  double best_cor_x = -10;
  double best_cor_y = -10;

  if(verbose)  {
    REprintf("   x <- c(");
    for(int i = 0; i < x.size(); i++)  {
      if(i > 0)  REprintf(", ");
      REprintf("%g", x[i]);
    }
    REprintf(")\n");
  }

  // Note: this loop breaks in final branch if(e == NULL), which means
  // there are no more points to consider
  while(1)  {
    double cor_x = my_cor(x, els_x);
    double cor_y = my_cor(y, els_y);


    if(verbose)  {
      REprintf("  elsx <- c(");
      for(int i = 0; i < els_x.size(); i++)  {
        if(i > 0)  REprintf(", ");
        REprintf("%g", els_x[i]);
      }
      REprintf(")\n  elsy <- c(");
      for(int i = 0; i < els_y.size(); i++)  {
        if(i > 0)  REprintf(", ");
        REprintf("%g", els_y[i]);
      }
      REprintf(")\n");


      if(cor_x > best_cor_x)  best_cor_x = cor_x;
      if(cor_y > best_cor_y)  best_cor_y = cor_y;
    }

    // check if we have a match
    if(cor_x >= min_cor &&
       cor_y >= min_cor)  {  
      if(verbose)  {
	REprintf("matchPlotPoints() found match for %d plot points starting at child %d. Returning\n",
                 n, first - els.begin());
	summarize_element(*first, "about to return from matchPlotPoitns");
      }
      // Return the start of the run
      return first - els.begin();
    }  else  {
      if(verbose)  {
	REprintf("Not a match: cor_x = %f   cor_y = %f for elements starting at %d\n",
                 cor_x, cor_y, first - els.begin());
      }
    }
    

    if(last == els.end())  {
      // No more points to try
      break;
    }  else  {
      XYCoords xy = plotElementCoords(*last);
      els_x.pop_front();
      els_x.push_back(xy.first);
      els_y.pop_front();
      // y coordinate must be negated to convert from device to user directionality
      els_y.push_back(-xy.second);
    }

    first++;
    last++;
    
  }

  if(verbose)  {
    REprintf("matchPlotPoints() considered %d starting children and found no matches in this plot region node.\n",
             first - els.begin() - start);
    REprintf("best_cor: x=%g y=%g. Returning -1\n", best_cor_x, best_cor_y);
  }

  return -1;
}


void tagPlotElements(XMLElementListIterator first,
		     int n,
		     char **ids,
		     const char *class_name,
		     int verbose)  {
  if(verbose)
    REprintf("tagPlotElements(): Trying to tag %d elements\n", n);
  
  for(int i = 0; i < n; i++)  {
    const char *id = ids[i];
    XMLElement *e = *(first + i);
    e->SetAttribute("id", id);
    e->SetAttribute("class", class_name);
  }
  if(verbose)
    REprintf("tagPlotElements(): Done tagging %d elements\n", n);

}





/// This is meant just for calling from R
extern "C" {
  void annotateAnalysisPageSVG(char **svg_filename,
			       int *n_elements,
			       double *x,
			       double *y,
			       char **ids,
			       char **class_name,
			       char **err_mesg,
			       int *start,
			       int *verbose)  {

    try  {
      XMLDocument doc;
      int loading_error = doc.LoadFile(svg_filename[0]);
    
      if(loading_error != XML_NO_ERROR) throw("Erroring loading file");

      if(verbose[0] > 0)  REprintf("C++ annotateAnalysisPageSVG: Loaded file %s\n", svg_filename[0]);
      int n = *n_elements;
      
      if(verbose[0] > 0)  REprintf("C++ annotateAnalysisPageSVG: n_elements = %d ", n);
    
      // convert x and y vectors into deque's---that is how
      // matchPlotPoints() wants them
      deque<double> xq(x, x + n);
      deque<double> yq(y, y + n);
      
      XMLElementList els = getPlotElements(&doc, verbose[0]);
      int first = matchPlotPoints(els,
				  xq,
				  yq,
				  0.999,
				  start[0],
				  verbose[0]);

      start[0] = first;
      
      if(first == -1)  throw("Couldn't find plot points");
      

      if(verbose[0] > 0)
	summarize_element(els[first], "first plot point before tagging");

      tagPlotElements(els.begin() + first,
		      n,
		      ids, class_name[0],
		      verbose[0]);

      if(verbose[0] > 0)
	summarize_element(els[first], "first plot point after tagging");
      

      if(verbose[0] > 0)
	REprintf("Next start: %d\n", start[0]);


      loading_error = doc.SaveFile(svg_filename[0]);

      if(loading_error != XML_NO_ERROR) throw("Erroring saving file");

      if(verbose[0] > 0)
	REprintf("C++ annotateAnalysisPageSVG: File saved successfully (errorcode = %d)\n", loading_error);


    }  catch(const char *mesg)  {
      err_mesg[0] = strdup(mesg);
    }
  }
}

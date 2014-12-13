#include <iostream>
#include <sstream>
#include "../tinyxml2.h"
#include "test.h"
#include "../AnalysisPageSVG.h"

using namespace tinyxml2;
using namespace std;



void test_exp_coords()  {
  double exp_coords[][2] = {{77.1016, 416.801},
			    {119.766, 330.801},
			    {162.434, 244.801},
			    {205.102, 158.801},
			    {247.766, 72.8008},
			    {290.434, 72.8008},
			    {333.102, 158.801},
			    {375.766, 244.801},
			    {418.434, 330.801},
			    {461.102, 416.801}};

  XMLDocument doc;
  doc.LoadFile("svg/ten-points.svg");

  XMLElementList els = getPlotElements(&doc);

  check_eq(els.size(), 10, "getPlotElements returned 10 elements");

  int i_plot_region = 0;

  
  XMLElement* el = els[0];
  int i = 0;
  while(el != NULL)  {
    XYCoords xy = plotElementCoords(el);
    stringstream ss;
    ss << i;
    string si = ss.str();

    check_eq(xy.first,
	     exp_coords[i][0],
	     string("first coord correct for element ") + si,
	     1e-3);
    check_eq(xy.second,
	     exp_coords[i][1],
	     string("second coord correct for element ") + si,
	     1e-3);

    el = el->NextSiblingElement("path");
    i++;
  }
}



void test_matchPlotPoints()  {
  XMLDocument doc;
  doc.LoadFile("svg/ten-points.svg");

  XMLElementList els = getPlotElements(&doc);




  // The plot is a hill shape: 1->5 then 5->1
  deque<double> xseq;
  int i;
  for(i = 1; i <= 10; i++)  xseq.push_back(i);
  deque<double> yseq;
  for(i = 1; i <= 5; i++)  yseq.push_back(i);
  for(i = 5; i >= 1; i--)  yseq.push_back(i);


  check(matchPlotPoints(els, xseq, yseq) == 0,
	string("matchPlotPoints (1:5, 5:1) returns first child element"));

  // Lets get just the middle 3-4-5-5-4-3
  deque<double> xsubseq(xseq.begin() + 2, xseq.begin() + 8);
  deque<double> ysubseq(yseq.begin() + 2, yseq.begin() + 8);

  
  check(matchPlotPoints(els, xsubseq, ysubseq) == 2,
	string("matchPlotPoints (3:5,5:3) returns third child element"));



  // Now break it --- test something which is too long
  deque<double> seq(12, 1);  // repeat 1, 12 times

  check(matchPlotPoints(els, seq, seq) == -1,
	"matchPlotPoints returns NULL if test coords are longer than candidate plot points");
  
  // Break it by swapping x and y--- then there would be no matching subseq
  check(matchPlotPoints(els, ysubseq, xsubseq) == -1,
	"matchPlotPoints returns NULL if no match");


  // Try it on horizontal and vertical lines
  deque<double> const_seq(10, 1);
  deque<double> linear_seq(xseq);  // xseq from above was linear

  doc.LoadFile("svg/horiz.svg");
  els = getPlotElements(&doc);
  check(matchPlotPoints(els, linear_seq, const_seq) == 0,
	"finds horizontal points");
  
  doc.LoadFile("svg/vertical.svg");
  els = getPlotElements(&doc);
  check(matchPlotPoints(els, const_seq, linear_seq) == 0,
	"finds vertical points");  
  
}


void test_tagPlotElements()  {
  XMLDocument doc;
  doc.LoadFile("svg/diag_with_axes.svg");

  XMLElementList els = getPlotElements(&doc);

  XMLElement *first = els[0];

  // verify that we start without class or id
  if(first->Attribute("id") != NULL)
    throw "Expecting to start without 'id' attribute";
  if(first->Attribute("class") != NULL)
    throw "Expecting to start without 'class' attribute";


  // tag first two
  // The strdup() avoids the "conversion from string literal to 'char *' is deprecated" warning
  char *ids[2] = {strdup("Reg1"), strdup("Reg2")};
  tagPlotElements(els.begin(), 2, ids, "plot-point");

  XMLElement *second = first->NextSiblingElement("path");
  XMLElement *third = second->NextSiblingElement("path");
  check_eq(first->Attribute("id"), "Reg1", "first id set to 'Reg1'");
  check_eq(first->Attribute("class"), "plot-point", "first class set to 'plot-point'");
  check_eq(second->Attribute("id"), "Reg2", "second id set to 'Reg2'");		  
  check_eq(second->Attribute("class"), "plot-point", "second class set to 'plot-point'");
  check(third->Attribute("id") == NULL, "third point has no ID");
  check(third->Attribute("class") == NULL, "third point has no class");
}


int main(int argc, char **argv)  {
  test_exp_coords();
  test_matchPlotPoints();
  test_tagPlotElements();

  final();

  return 0;
}

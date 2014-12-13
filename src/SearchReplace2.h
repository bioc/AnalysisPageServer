#ifndef __SEARCHREPLACE2_INCLUDED
#define __SEARCHREPLACE2_INCLUDED

#include <algorithm>
#include <string>
#include <iostream>
using namespace std;
string str_search_replace(const string& str, const string& oldStr, const string& newStr);



template <class StringIterator>
class Replacer : public unary_function<const string&, string> {
  
 // oldStrStart->[i]  will be replaced with newStrStart->[i]
 private:
  StringIterator oldStrStart, oldStrEnd;
  StringIterator newStrStart;
  
 public:
  
 Replacer(StringIterator os, StringIterator oe, StringIterator ns) : oldStrStart(os), oldStrEnd(oe), newStrStart(ns)  {}
  
  
  string operator()(const string &str) {
    string retval = str;
    for(StringIterator o = oldStrStart, n = newStrStart; o != oldStrEnd; o++, n++)  {
      retval = str_search_replace(retval, *o, *n);
    }
    return retval;
  }
  
};



template <class InputIterator, class OutputIterator, class StringIterator>
void replace_all(InputIterator first, InputIterator last,
		 OutputIterator result,
		 StringIterator oldStrStart, StringIterator oldStrEnd,
		 StringIterator newStrStart)  {

  Replacer<StringIterator> replacer(oldStrStart, oldStrEnd, newStrStart);
  
  transform(first, last, result, replacer);
}


/* This has to be visible from R_init_AnalysisPageServer, so we include it here */
extern "C" {
  void searchReplaceFile(char **inFile,
			 char **outFile,
			 char **oldStrs,
			 char **newStrs,
			 int *nrep,
			 char **err_mesg);
}


#endif

#include "SearchReplace2.h"
#include <string>
#include <cstring>
#include <iterator>
#include <iostream>
#include <fstream>
using namespace std;

string str_search_replace(const string& str, const string& oldStr, const string& newStr)
{
  string retval = str;
  size_t pos = 0;
  
  while((pos = retval.find(oldStr, pos)) != string::npos)
    {
      retval.replace(pos, oldStr.length(), newStr);
      pos += newStr.length();
    }
  
  return(retval);
}



// This class is to make it possible to iterator over lines of the input
// file instead of whitespace-delimited tokens.
struct Line
{
  string lineData;

  operator string() const
  {
    return lineData;
  }
};

istream& operator>>(istream& str,Line& data)
{
  getline(str,data.lineData);
  return str;
}



/// This is meant just for calling from R
extern "C" {
  void searchReplaceFile(char **inFile,
			 char **outFile,
			 char **oldStrs,
			 char **newStrs,
			 int *nrep,
			 char **err_mesg)  {


    try  {
      ifstream in(inFile[0]);
      if(!in.is_open())  throw("Error opening input file");

      ofstream out(outFile[0]);
      if(!out.is_open())  throw("Error opening output file");
      
      istream_iterator<Line> begin(in);
      istream_iterator<Line> eos;  // end of stream
      ostream_iterator<string> result(out, "\n");  //write result to outFile
      
      replace_all(begin, eos, result,
		  oldStrs, oldStrs + (*nrep),  // *nrep is dereferenced int pointer
		  newStrs);

      out.close();
    }  catch(const char *mesg)  {
      err_mesg[0] = strdup(mesg);
    }
  }
}

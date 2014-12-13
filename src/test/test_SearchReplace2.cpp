#include "test.h"
#include <iostream>
#include <vector>
#include <iterator>
#include "../SearchReplace2.h"
using namespace std;



int main(int argc, char **argv)  {
  string s1 = "FOO BAR FOO";
  string s1_unmodified = s1;
  
  
  check_eq(str_search_replace(s1, "blah", "BAZ"),
	   "FOO BAR FOO",
	   "no replacement");

  check_eq(str_search_replace(s1, "BAR", "BAZ"),
	   "FOO BAZ FOO",
	   "single replacement");

  check_eq(str_search_replace(s1, "FOO", "BAZ"),
	   "BAZ BAR BAZ",
	   "double replacement");

  check_eq(s1,
	   s1_unmodified,
	   "original string unmodified");


  vector<string> s;
  s.push_back("foo bar baz");
  s.push_back("blah foo");
  s.push_back("no f-o-o");

  vector<string> r;

  vector<string> oldStr, newStr;
  oldStr.push_back("foo");
  newStr.push_back("xxx");


  replace_all(s.begin(), s.end(),
	      back_inserter(r),
	      oldStr.begin(), oldStr.end(),
	      newStr.begin());

  vector<string> expected;
  expected.push_back("xxx bar baz");
  expected.push_back("blah xxx");
  expected.push_back("no f-o-o");

  check_eq(r.begin(),
	   r.end(),
	   expected.begin(),
	   "replace_all correct");

  
  // Prepare for triple replacement
  r.clear();
  oldStr.clear();
  oldStr.push_back("foo");
  oldStr.push_back("bar");
  oldStr.push_back("baz");
  newStr.clear();
  newStr.push_back("xxx");
  newStr.push_back("yy");
  newStr.push_back("z");


  replace_all(s.begin(), s.end(),
	      back_inserter(r),
	      oldStr.begin(), oldStr.end(),
	      newStr.begin());
  
  expected[0] = "xxx yy z";
  check_eq(r.begin(),
	   r.end(),
	   expected.begin(),
	   "replace_all correct with triple replacement");

  
	        
  final();
}

#include "test.h"
#include <iostream>
#include <cstring>
using namespace std;

int pass = 0;
int fail = 0;

void check(bool test, const string &test_name)  {
  if(test)  {
    cout << "PASS " << test_name << endl;
    pass++;
  }  else  {
    cout << "FAIL " << test_name << endl;
    fail++;
  }
}

bool eq(const double &x, const double &y, double tol)  {
  double d = x-y;
  return(d < tol && d > -tol);
}


void check_eq(const double &got, const double &expected, const string &test_name,
	      double tol)  {
  check(eq(got, expected, tol), test_name);
}

void check_eq(const int &got, const int &expected, const string &test_name)  {
  check(got == expected, test_name);
}

void check_eq(const char *got, const char *expected, const string &test_name)  {
  check(!strcmp(got, expected), test_name);
}


void check_eq(const string &got, const char *expected, const string &test_name)  {
  check(!strcmp(got.c_str(), expected), test_name);
}

void check_eq(const string &got, const string &expected, const string &test_name)  {
  check(!strcmp(got.c_str(), expected.c_str()), test_name);
}


void final()  {
  cout << "\nDone testing:\n"
       << pass << " passed tests\n"
       << fail << " failed tests\n";
}


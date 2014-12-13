#ifndef __TEST_H
#define __TEST_H

#include <string>
using namespace std;

void check(bool test, const string &test_name);

bool eq(const double &x, const double &y, double tol = 1e-5);

void check_eq(const double &got, const double &expected, const string &test_name,
	      double tol = 1e-5);

void check_eq(const int &got, const int &expected, const string &test_name);

void check_eq(const char *got, const char *expected, const string &test_name);

void check_eq(const string &got, const char *expected, const string &test_name);

void check_eq(const string &got, const string &expected, const string &test_name);

template <class Iterator1, class Iterator2>
void check_eq(Iterator1 got_start, Iterator1 got_end, Iterator2 expected_start,
	      const string &test_name)  {
  bool same = true;

  Iterator1 i = got_start;
  Iterator2 j = expected_start;
  for(; i != got_end; i++, j++)  {
    if(*i != *j)  {
      same = false;
      break;
    }
  }
  
  check(same, test_name);
}


void final();

#endif

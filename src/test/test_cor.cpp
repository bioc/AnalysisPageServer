#include <iostream>
#include "../cor.h"
#include "test.h"
using namespace std;



int main(int argc, char **argv)  {
  double x[] = {3, 3, 3, 3};
  double y[] = {2, 2, 2, 2};
  deque<double> xv(x, x+4);
  deque<double> yv(y, y+4);

  check_eq(my_cor(xv, yv), 1.0,
	   string("two const deques have my_cor = 1"));
  xv[1] = 3.5;
  check_eq(my_cor(xv, yv), 0.0,
	   string("one const, one non-const deque have my_cor = 0"));
  check_eq(my_cor(yv, xv), 0.0,
	   string("one non-const, one const deque have my_cor = 0"));

  yv[2] = 0.1;
  check_eq(my_cor(xv, yv), 0.33333333333,
	   string("two non-const deques have correct correlation"));
  
  final();
}

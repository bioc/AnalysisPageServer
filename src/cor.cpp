#include <deque>
#include <numeric>
#include <cmath>
#include <algorithm>
using namespace std;

double diameter(const deque<double> &x)  {
  if(x.size() == 0)  return 0;

  double xmin = *(min_element(x.begin(), x.end()));
  double xmax = *(max_element(x.begin(), x.end()));

  return xmax - xmin;
}

bool const_vec(const deque<double> &x,
	       double tolerance = 1e-5)  {
  return diameter(x) < tolerance;
}

// this really calculates Pearson correlation
double basic_cor(const deque<double> &x, const deque<double> &y)  {
  int n = x.size();
  if(n != y.size())  throw "different sizes";

  double sx = accumulate(x.begin(), x.end(), 0.0);
  double sx2 = inner_product(x.begin(), x.end(), x.begin(), 0.0);
  double sy = accumulate(y.begin(), y.end(), 0.0);
  double sy2 = inner_product(y.begin(), y.end(), y.begin(), 0.0);
  double sxy = inner_product(x.begin(), x.end(), y.begin(), 0.0);

  double numerator = n * sxy - sx * sy;
  double denominator = sqrt(n * sx2 - sx * sx) * sqrt(n * sy2 - sy * sy);
  
  return numerator / denominator;
} 


// correlation function quietly returns 1 if x and y are both constant,
// 0 if only one is constant, and cor(x,y) otherwise---this is what we
// need for screening for matches based on correlation.
double my_cor(const deque<double> &x, const deque<double> &y,
	      double tolerance = 1e-5)  {

  bool x_const = const_vec(x, tolerance);
  bool y_const = const_vec(y, tolerance);
  
  if(x_const && y_const)  return 1;
  if(x_const ^ y_const)  return 0;   // xor

  return(basic_cor(x,y));
}      

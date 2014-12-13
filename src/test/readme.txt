These are unit tests that I wrote for some of the lower-level C++ functions.
They are designed to be run completely outside of R. This is how you do it:
First cd into this directory. Then build the test executables:

make all

Then run them

./test_cor
./test_AnalysisPageSVG
./test_SearchReplace2

The last line of each should say "0 failed tests"

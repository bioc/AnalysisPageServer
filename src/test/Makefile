all: test_cor test_AnalysisPageSVG test_SearchReplace2
test_cor: test_cor.cpp test.cpp ../cor.cpp test.h ../cor.h
	c++ test_cor.cpp ../cor.cpp test.cpp -o test_cor
## This one needs to link against libR.so so that it gets REprintf, since that is I guess used inside of AalysisPageSVG.cpp
test_AnalysisPageSVG: test_AnalysisPageSVG.cpp ../AnalysisPageSVG.cpp ../tinyxml2.cpp ../cor.cpp test.cpp ../cor.h ../AnalysisPageSVG.h test.h
	c++ -I${R_HOME}/include -L${R_HOME}/lib -lR test_AnalysisPageSVG.cpp ../AnalysisPageSVG.cpp ../tinyxml2.cpp ../cor.cpp test.cpp -o test_AnalysisPageSVG
test_SearchReplace2: test_SearchReplace2.cpp ../SearchReplace2.cpp ../SearchReplace2.h test.cpp test.h
	c++ test_SearchReplace2.cpp ../SearchReplace2.cpp test.cpp -o test_SearchReplace2
clean:
	rm -f *.o test_cor test_AnalysisPageSVG test_SearchReplace2

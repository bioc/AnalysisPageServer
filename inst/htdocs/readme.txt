
The JS subdirectory contains both the full javascript codebase as well as the "built" front ends
in the dist-aps and dist-apss subdirectories. dist-aps is for AnalysisPageServer (when running in server
mode) and dist-apss is for running on static files.

client/README.md contains instructions for front-end developers who want to make new front-end
build. People using the R package should never have to do that since the front-end is built before
including it in the R package.


These commands update the copy of the front end that is inside our local SVN repository with
the copy that Adrian maintains.

svn merge http://resscm/bioinfo/projects/ExpressionPlot/web/js/BasicFrontEnd/trunk client
# svn merge http://resscm/bioinfo/projects/ExpressionPlot/web/js/BasicFrontEnd/branches/optimized_for_prod client


This removes the ExpressionPlot-specific files.
svn rm client/expressionplot-app.html client/dist-ep


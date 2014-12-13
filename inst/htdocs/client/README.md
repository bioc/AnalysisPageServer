# ExpressionPlot / AnalysisPageServer Front-End Component
     
     

In order to perform full front-end deployment for any of available deployment targets you should have installed Node.js with NPM.

The process is based on widespread front-end development tools:

[NPM](http://npmjs.org) is used to install dependencies specified in **package.json** file.

[Bower](http://bower.io) is a tool to manage front-end component dependencies specified in **bower.json** file.

[Gulp](http://gulpjs.com) is a task builder/runner able to execute **gulpfile.js**.

In root directory

    $ npm install
    
will install dependencies specified in package.json locally into /node_modules directory.   

Similarly

    $ bower install
    
installs front-end dependencies into /bower_components directory.

There are 3 deployment targets:

- ExpressionPlot: /dist-ep
- AnalysisPageServer: /dist-aps
- AnalysisPageServerStatic: /dist-apss

Building each of them is handled by separate task located in **gulpfile.js**.

Build task consists of a few steps:
- Require.js module concatenation and minification
- LESS files transformation into CSS 
- CSS concatenation
- copying assets like html, font, image files
- generating proper directory structure *inside* deployment targets
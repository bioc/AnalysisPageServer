# ExpressionPlot / AnalysisPageServer Front-End Component

In order to perform full front-end deployment for any of available deployment targets you should have installed Node.js with NPM.

The process is based on widespread front-end development tools:

[NPM](http://npmjs.org) is used to install dependencies specified in **package.json** file.

[JSPM](http://jspm.io) is a tool to manage front-end component dependencies specified in a subsection of **package.json** file.

[Gulp](http://gulpjs.com) is a task builder/runner able to execute **gulpfile.js**.

JSPM handles:
- ES6 module concatenation, transpilation and minification along with
- LESS files transformation into CSS & concatenation
- HTML template files import and concatenation

Gulp build task's sole purpose is:
- copying assets like html entry document, font, image files
- generating proper directory structure *inside* deployment targets


### Development environment

This component has been tested on:

 - RHEL6 (production server configuration)
 - CENTOS6 (vagrant setup)
 - OSX

There are known issues when installing packages within
Ubuntu system, so it is not recommended to use it
and it's not supported.

### Using vagrant for development

In order to use vagrant setup, you need to have installed:

 * Oracle Virtual Box (https://www.virtualbox.org/)
 * Vagrant (https://www.vagrantup.com/)

After successful install, please go to project
folder, copy gulp.config.dist.js to gulp.config.js:

    $ cp gulp.config.dist.js gulp.config.js

And then run vagrant:

    $ vagrant up

It should prepare most of the development configuration for you.
Application is installed in:

    /home/vagrant/app

To finish installation please:

Go to vagrant ssh

    $ vagrant ssh

Install missing jspm packages

    $ cd app
    $ jspm install

When asked, please provide your own github auth token.

To run local development server:

    $ gulp [app] serve

where app can be:
 - ep (expression plot)
 - aps (application page server)
 - apss (application page server static)

If you don't pass app, the 'ep' is used by default.
By default server is running on port 8000, and it's mapped
to localhost vagrant box.

### Deployment targets

There are 3 deployment targets:

- ExpressionPlot: /dist-ep
- AnalysisPageServer: /dist-aps
- AnalysisPageServerStatic: /dist-apss

The shell arguments that abbreviate them are: EP, APS and APSS
respectively.

In order to build i.e. ExpressionPlot front-end you have to run from the project's
root directory:

    $ ./bin/build.sh EP

or

    $ gulp ep build

If called without an argument it builds all deployment targets.

    $ ./bin/build.sh

or

    $ gulp

### Testing

Test scripts are listed in package.json under *scripts* key.
To run them `npm run test-unit` and `npm run test-e2e` should be executed
on the console.

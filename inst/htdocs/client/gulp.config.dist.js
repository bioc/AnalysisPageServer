module.exports = {
    defaultEnvironment: 'ep',
    port: 8000,
    apiTarget: 'http://reswebappdev301.gene.com:8088/',
    ep: {
        dist: 'dist-ep',
        initJS: 'init-ep',
        initHTML: 'expressionplot-app.html',
        bundleJS: 'bundle.js'
    },
    aps: {
        dist: 'dist-aps',
        initHTML: 'analysis-page-server.html',
        initJS: 'init-aps',
        bundleJS: 'bundle.js'
    },
    apss: {
        dist: 'dist-apss',
        initHTML: 'analysis-page-server-static.html',
        initJS: 'init-apss',
        bundleJS: 'bundle.js'
    }
};
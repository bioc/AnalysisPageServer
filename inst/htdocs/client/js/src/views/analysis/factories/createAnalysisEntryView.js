/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/analysis/factories/createArrayView",
"views/analysis/factories/createTableView",
"views/analysis/factories/createPlotView",
"views/analysis/factories/createHtmlResponseView",
"views/analysis/factories/createDefaultView"], 
    function(createArrayView, createTableView, createPlotView, 
    createHtmlResponseView, createDefaultView) {
    var factory = function(definition, options) {
        options = options || {};
        options.createAnalysisEntryView = factory;
        switch (definition.type) {
            case "array":
                return createArrayView(definition, _.clone(options));
            case "table":
                return createTableView(definition, _.clone(options));
            case "plot":
                return createPlotView(definition, _.clone(options));
            case "html":
                return createHtmlResponseView(definition, _.clone(options));
            default:
                return createDefaultView(definition, _.clone(options));
        }
    }
    return factory;
});
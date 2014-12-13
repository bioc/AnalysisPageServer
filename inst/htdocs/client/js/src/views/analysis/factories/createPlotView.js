/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/analysis/plot/PlotView", "models/TableDataModel",
    "views/analysis/factories/createTableView"], 
function(PlotView, TableDataModel, createTableView) {
    return function(definition, options) {
        var tableDefinition = definition.value.table;
//        delete definition.value.table;
        var model = new TableDataModel(_.extend(tableDefinition, {
            plotFile:   definition.value.plot
        }), _.pick(options, "pageModel", "perChunk"));

        var ret = [];

        var includeWarnings = _.isArray(definition.warnings) && _.size(definition.warnings) > 0;

        var p = new PlotView(_.extend(_.clone(options), {
            model:      model,
            className:  "ep-analysis-plot row-fluid",
            caption:    tableDefinition.value.caption,
            warnings:   includeWarnings && definition.warnings
        }));
        
        ret.push(p);

        if (options.pageModel.get("tableVisible")) {
            ret.push(createTableView(tableDefinition, _.extend(_.clone(options), {
                parent:         p,
                model:          model
            })));
        }

        return ret;
    }
});
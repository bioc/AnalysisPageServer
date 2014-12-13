/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/analysis/TableView", "models/TableDataModel"], function(TableView, TableDataModel) {
    return function(definition, options) {
        options.model || (options.model = new TableDataModel(definition, _.pick(options, "pageModel", "perChunk")));
        options.className || (options.className = "");
        options.className += " row-fluid ep-analysis-table";
        return new TableView(options);
    }
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "bootstrap"], 
    function(Marionette, Bacon) {
        
    return Marionette.LayoutView.extend({
        template: "#ep-analysis-table-tmpl",
        
        regions: {
            thead: "[data-table-thead]",
            tbody: "[data-table-tbody]"
        },
        
        ui: {
            downloadCsvBtn: ".ep-download-csv",
            nbRows: ".ep-table-info .text-info"
        },
        
        triggers: {
            "click @ui.downloadCsvBtn": "download:csv"
        },
        
        modelEvents: {
            "filter:complete": "onModelFilterComplete"
        },
        
        className:  "ep-analysis-table",
        
        initialize: function(opts) {

        },
          
        getDestroyES: function() {
            return this.asEventStream("before:destroy").take(1);
        },
        
        templateHelpers: function() {
            return {
                withPlot: this.getOption("withPlot")
            };
        },
        
        onRender: function() {
            this.updateNbRowsShown();
        },

        onDestroy: function() {

        },
        getTbodyWidth: function() {
            return this.getChildView("tbody").getWidth();
        },
        getTheadWidth: function() {
            return this.getChildView("thead").getWidth();
        },
        getTheadColumnWidths: function() {
            return this.getChildView("thead").getColumnWidths();
        },
        updateNbRowsShown: function() {
            var filteringApplied = this.model.get("currentSize") < this.model.get("size");
            this.ui.nbRows
                    .text(filteringApplied ? 
                        "Showing "+this.model.get("currentSize")+" of "+this.model.get("size")
                                :
                        "Showing All "+this.model.get("size"));
        },      
        onModelFilterComplete: function(dataChunk, rowIds) {
            this.updateNbRowsShown();
        }
    });
});
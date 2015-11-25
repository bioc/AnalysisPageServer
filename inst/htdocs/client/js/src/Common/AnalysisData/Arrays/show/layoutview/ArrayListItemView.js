/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], 
function(Marionette) {
    return Marionette.LayoutView.extend({
        template: "#ep-analysis-array-list-item-tmpl",
        
        regions: {
            content: "[data-content]"
        },
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        
        onRender: function() {
            var v = this.getReqRes().request("analysis-data:views:"+this.model.get("type"), 
                    this.model.analysisData, {
                        pageModel: this.getOption("pageModel")
                    });
            v && this.getRegion("content").show(v);
        }
    });
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../layoutview/ArrayListItemView"], 
function(Marionette, ItemView) {
    return Marionette.CollectionView.extend({
        tagName: "dl",
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        
        childView: ItemView,
        childViewOptions: function(dataModel, i) {
            return {
                pageModel: this.getOption("pageModel")
            };
        }
    });
});
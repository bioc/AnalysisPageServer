/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/ParameterBehavior"], 
    function(Marionette, BaseBehavior) {
    return Marionette.CompositeView.extend({
        template: "#ep-form-compound-tmpl",
        className: "control-group control-compound-group light-blue",
        
        childViewContainer: "[data-children-region]",
        
        getChildView: function(childModel) {
            return this.getReqRes().request("parameters:views:class", childModel);
        },
        
        childViewOptions: function(childModel, idx) {
            return _.extend(
                    this.getReqRes().request("parameters:views:options", childModel, this),
                    {
                        compoundChild: {
                            idx: idx
                        }
                    }
                    );
        },
        
        behaviors: {
            Base: {
                behaviorClass: BaseBehavior
            }
        },
        
        onShowFully: function() {
            this.children.invoke("triggerMethod", "show:fully");
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        templateHelpers: function() {
            return this.getReqRes().request("parameters:views:template-helpers", this);
        }
    });
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/ParameterBehavior"], 
function(Marionette, BaseBehavior) {
    return Marionette.CompositeView.extend({
        template: "#ep-form-array-tmpl",
        className: "control-group control-array-group light-blue",
        
        childViewContainer: "[data-children-region]",
        
        getChildView: function(childModel) {
            return this.getReqRes().request("parameters:views:class", childModel);
        },
        
        childViewOptions: function(childModel, idx) {
            return _.extend(
                    this.getReqRes().request("parameters:views:options", childModel, this),
                    {
                        arrayChild: {
                            labelIsNumber: true,
                            idx: idx
                        }
                    }
                    );
        },
        
        ui: {
            addBtn: ".ep-array-add-child",
            removeBtn: ".ep-array-remove-child"
        },

        triggers: {
            "click @ui.addBtn": "click:add-btn",
            "click @ui.removeBtn": "click:remove-btn"
        },
        
        collectionEvents: {
            "add": "onAddChild",
            "remove": "onRemoveChild"
        },
        
        behaviors: {
            Base: {
                behaviorClass: BaseBehavior
            }
        },
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        
        initialize: function() {
            this.getCommands().execute("parameters:views:array:listen-to", this);
        },
        
        templateHelpers: function() {
            return this.getReqRes().request("parameters:views:template-helpers", this);
        },
        onRender: function() {
            this.updateButtons();
        },
        onShowFully: function() {
            this.children.invoke("triggerMethod", "show:fully");
        },
        updateButtons:  function() {
            if (this.model.get("min") == this.model.get("max")) {
                this.ui.addBtn.hide();
                this.ui.removeBtn.hide();
            }
            else {
                this.ui.addBtn.prop("disabled", this.model.isMax());
                this.ui.removeBtn.prop("disabled", this.model.isMin());
            }
        },
        onAddChild: function(childModel) {
            this.updateButtons();
        },
        onRemoveChild: function(childModel) {
            this.updateButtons();
        }
    });
});
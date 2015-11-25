/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * It renders parameter values as uneditable list.
 * Present at first in sidebar after loading analysis plot response.
 */
define(["marionette", "bacon"], function(Marionette, Bacon) {
    return Marionette.CompositeView.extend({
        template: "#ep-parameters-summary-item-tmpl",
        tagName: "li",
        
        childViewContainer: "ul",
        childViewOptions: function(childModel) {
            return {
                isRoot: false,
                collection: childModel.children
            };
        },
        
        templateHelpers: function() {
            return {
                isRoot: this.getOption("isRoot"),
                readableLabel: this.getReadableLabel(),
                readableValue: this.getReadableValue()
            };
        },
        
        initialize: function() {
            this.model.isActive()
                    .takeUntil(this.getDestroyES())
                    .onValue(this, "_onChangeActive");
        },
        
        getReadableValue: function() {
            var v = this.model.get("readable") || this.model.get("value");
            if (_.isBoolean(v)) {
                return v ? "true" : "false";
            }
            else {
                return _.isArray(v) ? (v || []).join("<br/>") : v;
            }
        },
        
        getReadableLabel: function() {
            if (this.model.parent && this.model.parent.get("type") === "array") {
                return this.model.parent.children.indexOf(this.model)+1;
            }
            else {
                return this.model.get("label");
            }
        },
        
        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        
        _onChangeActive: function(isActive) {
            this.$el[isActive ? "removeClass" : "addClass"]("hide");
        }
    });
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../behaviors/ParameterBehavior"], 
function(Marionette, BaseBehavior) {
    return Marionette.ItemView.extend({
        template: "#ep-form-file-tmpl",
        className: "control-group",
        
        ui: {
            field: "input[type=file]"
        },
        
        events: {
            "change @ui.field": "_onChange"
        },
        
        templateHelpers: function() {
            return this.getReqRes().request("parameters:views:template-helpers", this);
        },
        
        Base: {
            behaviorClass: BaseBehavior
        },
        
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },

        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        
        focus:  function() {
            this.ui.field.focus();
        },
        
        _onChange: function(e) {
            var file = e.target.files[0];
            this.model.setValue(file);
        }
    });
});
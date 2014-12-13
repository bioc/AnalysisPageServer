/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/parameters/ParameterView", "TemplateManager"], function(ParameterView, TemplateManager) {
    var TextParameterView = ParameterView.extend({
        events: {
            "keyup input":     "onKeyup"
        },
        
        initialize: function() {
            ParameterView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, "change:value", this.onModelChangeValue);
        },
        
        render: function() {
            var p = TemplateManager.render("ep-form-text-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.renderLabel(),
                value:          this.model.get("value"),
                desc:           this.renderDescription(),
                placeholder:    this.model.get("prompt"),
                size:           this.getSizeClass(),
                descSize:       this.getDescSize(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            ParameterView.prototype.render.call(this);
        },

        focus:  function() {
            this.$("input").focus();
        },
                
        onModelChangeValue:  function(model, value, opts) {
            var $field = this.$("input");
            opts.viewTriggered || $field.val(value);
        },
        
        onKeyup:    function(e) {
            var $field = $(e.currentTarget), val = $field.val();
            if (val == null) this.model.unset("value");
            else this.model.set("value", val, {viewTriggered: true});
        }
    });
    return TextParameterView;
});
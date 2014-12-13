/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/parameters/ParameterView", "TemplateManager"], function(ParameterView, TemplateManager) {
    var BoolParameterView = ParameterView.extend({
        events: {
            "click button":     "onClick"
        },
        
        initialize: function() {
            ParameterView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, "change:value", this.onModelChangeValue);
        },
        
        render: function() {
            var p = TemplateManager.render("ep-form-bool-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.model.get("label")+":",
                buttonLabel:    this.model.get("value") ? "ON" : "OFF",
                active:         this.model.get("value") === true,
                desc:           this.model.get("description"),
                placeholder:    this.model.get("prompt"),
                size:           this.getSizeClass(),
                descSize:       this.getDescSize(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            ParameterView.prototype.render.call(this);
        },
        
        toggleButton:   function() {
            
        },
        
        focus:  function() {
            this.$("button").focus();
        },
        
        onModelChangeValue:  function(model, value) {
            var $btn = this.$("button");
            $btn.text(value ? "ON" : "OFF");
            $btn[value ? "addClass" : "removeClass"]("active");
        },
        
        onClick:    function(e) {
            var $btn = $(e.currentTarget);
            $btn.toggleClass("active");
            $btn.text($btn.hasClass("active") ? "ON" : "OFF");
            this.model.set("value", $btn.hasClass("active"));
        }
    });
    return BoolParameterView;
});
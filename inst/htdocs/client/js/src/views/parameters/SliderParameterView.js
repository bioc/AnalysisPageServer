define(["bacon", "views/parameters/ParameterView", "TemplateManager"], function(Bacon, ParentView, TemplateManager) {
    var SliderParameterView = ParentView.extend({
        initialize: function() {
            ParentView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, "change:value", this.onModelChangeValue);
        },
        
        render: function() {
            var p = TemplateManager.render("ep-form-slider-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.model.get("label")+":",
                value:          this.model.get("value"),
                min:            this.model.get("min"),
                max:            this.model.get("max"),
                step:           this.model.get("step"),
                desc:           this.model.get("description"),
                size:           this.getSizeClass(),
                descSize:       this.getDescSize(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            ParentView.prototype.render.call(this);
            this.$slider = this.$("input[type=range]");
            var changeES = this.$slider.asEventStream("change");
            changeES
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onChange");
            this.$slider.asEventStream("focus")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onFocus");
            this.$slider.asEventStream("input")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onInput");
        },
        
        focus:  function() {
            this.$("input[type=range]").focus();
        },
        onModelChangeValue:  function(model, value) {
            var $field = this.$("input[type=range]");
            $field.val(value);
        },
        
        onInput:    function(e) {
            var $field = $(e.currentTarget), val = $field.val();
            this.$("label span").text(val);
        },
        
        onChange:    function(e) {
            var $field = $(e.currentTarget), val = $field.val();
            if (val == null) this.model.unset("value");
            else this.model.set("value", parseFloat(val), {viewTriggered: true});
        },
        onFocus:    function() {
            this.fadeIn();
        }
    });
    return SliderParameterView;
});
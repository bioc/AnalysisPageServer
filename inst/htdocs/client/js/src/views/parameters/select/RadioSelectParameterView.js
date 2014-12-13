/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/parameters/select/SelectParameterView", "TemplateManager", "bacon.jquery"], 
function(ParentView, TemplateManager) {
    var RadioSelectParameterView = ParentView.extend({
        
        initialize: function() {
            ParentView.prototype.initialize.apply(this, arguments);
        },
        
        initializeDomEventStreams: function() {
            var actualValueProp = Bacon.$.radioGroupValue(this.$("[type=radio]"));
            actualValueProp
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "_setModelValue");
        },
        
        render: function() {
            var p = TemplateManager.render("ep-form-select-radio-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.model.get("label")+":",
                value:          this.model.get("value"),
                choices:        this._prepareChoices(),
                desc:           this.model.get("description"),
                size:           this.getSizeClass(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            ParentView.prototype.render.call(this);
            this.initializeDomEventStreams();
        },
        
        focus:  function() {
            this.$("input").eq(0).focus();
        },
        onModelChangeValue:  function(model) {
            var $field = this.$("[type=radio]").filter(function() {
                return $(this).val() == model.get("value");
            });
            $field.prop("checked", true);
        },
        
        onFocus:    function() {
            this.fadeIn();
        }
    });
    return RadioSelectParameterView;
});
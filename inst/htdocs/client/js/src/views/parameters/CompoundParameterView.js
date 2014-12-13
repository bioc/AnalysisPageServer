/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/parameters/ComplexParameterView", "TemplateManager"], function(ComplexParameterView, TemplateManager) {
    var CompoundParameterView = ComplexParameterView.extend({
        children:   null,
        initialize: function() {
            this.children = [];
            ComplexParameterView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            var p = TemplateManager.render("ep-form-compound-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.renderLabel(),
                desc:           this.renderDescription(),
                size:           this.getSizeClass(),
                descSize:       this.getDescSize(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            this.renderChildren();
            ComplexParameterView.prototype.render.call(this);
        },
        /**
         * Acts only on view of child parameter.
         * @returns {undefined}
         */
        addChildView:   function(model) {
            ComplexParameterView.prototype.addChildView.call(this, model, {
                compoundChild: {
                    idx:            this.children.length
                }
            });
        },
        focus:  function() {
            
        }
    });
    return CompoundParameterView;
});
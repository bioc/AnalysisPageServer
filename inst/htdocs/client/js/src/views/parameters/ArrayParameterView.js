/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/parameters/ComplexParameterView", "TemplateManager"], 
function(ComplexParameterView, TemplateManager) {
    var ArrayParameterView = ComplexParameterView.extend({
        children:   null,
        $addBtn:    null,
        $removeBtn: null,
        events: {
            "click .ep-array-add-child":  "onClickAdd",
            "click .ep-array-remove-child":  "onClickRemove"
        },
        initialize: function() {
            this.children = [];
            ComplexParameterView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, "add:child", this.onChildAdded);
            this.listenTo(this.model, "destroy:child", this.onChildDestroyed);
        },
        render: function() {
            var p = TemplateManager.render("ep-form-array-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.model.get("label")+":",
                desc:           this.model.get("description"),
                size:           this.getSizeClass(),
                descSize:       this.getDescSize(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            this.$addBtn = this.$(".ep-array-add-child");
            this.$removeBtn = this.$(".ep-array-remove-child");
            this.renderChildren();
            this.updateButtons();
            ComplexParameterView.prototype.render.call(this);
        },
                
        focus:  function() {
            var childIsRequired = this.model.get("prototype").required;
            if (this.children.length > 0) {
                this.children[0].focus();
                if (! childIsRequired) {
                    _.each(this.children, function(child) {child.focus(); });
                }
            }
        },
                
        updateButtons:  function() {
            if (this.model.get("min") == this.model.get("max")) {
                this.$addBtn.remove();
                this.$removeBtn.remove();
            }
            else {
                this.$addBtn.prop("disabled", this.model.isMax());
                this.$removeBtn.prop("disabled", this.model.isMin());
            }
        },
        /**
         * Acts only on view of child parameter.
         * @returns {undefined}
         */
        addChildView:   function(model) {
            ComplexParameterView.prototype.addChildView.call(this, model, {
                arrayChild: {
                    idx:            this.children.length,
                    labelIsNumber:  true
                }
            });
        },
        removeChildView:    function() {
            var v = this.children.pop();
            v.remove();
        },
        onChildAdded:   function(childModel) {
            this.updateButtons();
            this.addChildView(childModel);
        },
        onChildDestroyed:   function(childModel) {
            this.updateButtons();
            this.removeChildView();
        },
        onClickAdd: function() {
            this.model.addChild();
        },
        onClickRemove: function() {
            this.model.destroyLastChild();
        }
    });
    return ArrayParameterView;
});
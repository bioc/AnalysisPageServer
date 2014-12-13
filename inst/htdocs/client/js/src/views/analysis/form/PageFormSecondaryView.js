/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/analysis/form/PageFormView", "TemplateManager"], function(PageFormView, TemplateManager) {
    var PageFormSecondaryView = PageFormView.extend({
        getType:    function() {
            return PageFormView.TYPE_SECONDARY;
        },
        render: function() {
            this.$el.html(TemplateManager.render("ep-analysis-secondary-form-tmpl"));
            PageFormView.prototype.render.call(this);
        }
    });
    return PageFormSecondaryView;
});
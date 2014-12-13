/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", 
    "views/pages/PageView",
    "views/analysis/form/PageFormPrimaryView"], 
function(Backbone, Bacon, ParentView, PageFormPrimaryView) {
    var PrimaryPageView = ParentView.extend({
        initialize: function(opts) {
            ParentView.prototype.initialize.apply(this, arguments);
            this.$el.prop("id", this.model.get("name")+"-page-view");
        },
        render: function() {
            this.renderLabel();
            this.renderForm();
        },
        renderForm:   function() {
            this.form = new PageFormPrimaryView({
                model:      this.model,
                pageView:   this,
                appModel:   this.appModel,
                appView:    this.appView,
                eventBus:   this.eventBus
            });
            this.children.push(this.form);
            this.form.render();
            this.$el.append(this.form.$el);
        },
        renderLabel:    function() {
            this.$el.append(
                    $("<div></div>").prop("id", this.model.get("name")+"-caption").addClass("row-fluid ep-caption").append(
                        $("<div></div>").addClass("span12 text-center lead")
                            .html(this.model.get("description"))));
        }
    });
    return PrimaryPageView;
});
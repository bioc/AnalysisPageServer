/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "views/analysis/form/PageFormView", "TemplateManager"], 
function(Bacon, PageFormView, TemplateManager) {
    var PageFormPrimaryView = PageFormView.extend({
        getType:    function() {
            return PageFormView.TYPE_PRIMARY;
        },
        initialize: function(opts) {
            PageFormView.prototype.initialize.call(this, opts);
            this.pageView = opts.pageView;
            this.appView = opts.appView;
        },
        initializeEventBus: function() {
            PageFormView.prototype.initializeEventBus.call(this);
            
        },
        render: function() {
            this.$el.html(TemplateManager.render("ep-analysis-primary-form-tmpl"));
            
            PageFormView.prototype.render.call(this);
            
            this.listenTo(this.model.parameters, "parameter:change:value", this.onParameterChangeValue);
        },
//        fadeOutDescendants: function() {
//            _.each(this.descendants, function(affectedView) {affectedView.fadeOut();});
//        },
//        updateFading: function(withRefocus) {
//            var model = this.model.parameters.getFirstUnready();
//            var view = this.getParameterView(model);
//            var idx = _.indexOf(this.descendants, view);
//            var visibleViews = idx > -1 ? _.first(this.descendants, idx+1) : this.descendants;
//            var fadedOutViews = idx > -1 ? _.rest(this.descendants, idx+1) : [];
//            _.each(visibleViews, function(affectedView) {affectedView.fadeIn();});
//            _.each(fadedOutViews, function(affectedView) {affectedView.fadeOut();});
//            withRefocus && view && view.focus();
//        },
        updateFading: function() {
            // all parameter views start visible
            // filtered without dependencies met are faded out
            _.each(this.descendants, function(parameterView) {
                if (parameterView.model.areDependenciesMet()) {
                    parameterView.fadeIn();
                }
                else {
                    parameterView.fadeOut();
                }
            });
        },
        _onParameterChangeValue: function(isReady) {
            if (isReady) {
                this.toggleSubmitButton("enabled");
                this.toggleSubmitButton("callToAction");
            }
            else {
                this.toggleSubmitButton("disabled");
            }
        },
        onParameterChangeValue: function(parameterModel) {
            // text param shouldn't lose focus as soon as a user types sth
            this.updateFading(parameterModel.get("type") !== "text");
            this.model.parameters.isReady()
                    .take(1)
                    .onValue(this, "_onParameterChangeValue");
        },
        onAppModelChangeMode:   function() {
            PageFormView.prototype.onAppModelChangeMode.call(this);
            this.updateFading();
        }
    });
    return PageFormPrimaryView;
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", 
    "views/pages/PageView",
    "views/analysis/factories/createAnalysisEntryView"], 
function(Bacon, ParentView, createAnalysisEntryView) {
    var AnalysisPageView = ParentView.extend({
        initialize: function(opts) {
            ParentView.prototype.initialize.apply(this, arguments);
            this.analysis = opts.analysis;
            this.$el.prop("id", this.model.get("name")+"-page-view");
            this.perChunk = opts.perChunk;
        },
        render: function() {
            this.renderLabel();
            this.renderAnalysis();
        },
        renderAnalysis:   function() {
            this.analysisViews = createAnalysisEntryView(this.analysis, _.extend(
                    _.pick(this, [
                        // have to pass this packed as a function
                        // because of circular-references when AnalysisPageView contains
                        // pseudo AnalysisPageViews
                        "createPageView", 
                        "appView", "eventBus", "perChunk"
                    ]),
                    {
                        pageView:  this,
                        pageModel: this.model
                    }));
            _.isArray(this.analysisViews) || (this.analysisViews = [this.analysisViews]);
            _.each(this.analysisViews, function(av) {
                this.$el.append(av.$el);
                av.render();
            }, this);
            // children property is required for "remove" method to cascade to children
            this.children = this.analysisViews;
            delete this.analysis;
        },
        renderLabel:    function() {
            this.model.get("topmostCaption") && 
                    this.$el.append(
                        $("<div></div>").addClass("row-fluid ep-caption").append(
                            $("<div></div>").addClass("span12 text-center lead")
                                .html(this.model.get("topmostCaption"))));
        }
    });
    return AnalysisPageView;
});
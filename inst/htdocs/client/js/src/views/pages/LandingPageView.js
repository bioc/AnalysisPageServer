/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", 
    "views/pages/PageView", "TemplateManager",
    "views/LandingPageFormView", "views/LandingPageToolOverviewView",
    "views/analysis/factories/createTableView"], 
function(Backbone, Bacon, ParentView, TemplateManager, LandingPageFormView, 
    LandingPageToolOverviewView, createTableView) {
    var LandingPageView = ParentView.extend({
        initialize: function(opts) {
            ParentView.prototype.initialize.apply(this, arguments);
            this.$el.prop("id", this.model.get("name")+"-page-view");
            this.pages = opts.pages;
        },
        render:   function() {
            this.appModel.isEnv("expressionplot") && this.renderDescription();
            this.appModel.isEnv("expressionplot") && this.renderStudyForm();
            this.renderToolOverview();
            this.appModel.isEnv("expressionplot") && this.renderProjectsTable();
        },
        renderDescription:  function() {
            var desc = "<strong>ExpressionPlot</strong> is a portal into microarray and RNA-Seq gene expression "+
                            "data both generated at Genentech and imported from outside sources.";
            this.$el.append(
                    $("<div></div>").addClass("row-fluid ep-caption").append(
                        $("<div></div>").addClass("span10 offset1 text-center lead")
                            .html(desc)));
        },
        renderStudyForm:    function() {
            this.$el.append(TemplateManager.render("ep-landing-forms-tmpl"));
            var studyPage = this.pages.get("study.summary");
            this.studyFormView = new LandingPageFormView({
                className:      "span6",
                tabindex:       0,
                model:          studyPage,
                mainParameter:  "study",
                appView:        this.appView,
                pages:          this.pages,
                eventBus:       this.eventBus
            });
            this.children.push(this.studyFormView);
            this.$(".ep-landing-row-forms").append(this.studyFormView.$el);
            this.studyFormView.render();
        },
        renderToolOverview: function() {
            this.landingToolOverview = new LandingPageToolOverviewView({
                className:  "row-fluid",
                appView:    this.appView,
                pages:      this.pages,
                eventBus:   this.eventBus
            });
            this.children.push(this.landingToolOverview);
            this.$el.append(this.landingToolOverview.$el);
            this.landingToolOverview.render();
        },
        renderProjectsTable:    function() {
            function doCreateTableView(view, pageModel, analysis) {
                view.projectsTableView = createTableView(analysis, {
                    parent:         view,
                    pageModel:      pageModel,
                    pageView:       view,
                    appView:        view.appView,
                    eventBus:       view.eventBus
                });
                view.children.push(view.projectsTableView);
                var $header = $("<div></div>").addClass("row-fluid")
                        .append($("<div></div>")
                            .addClass("offset1 span10 text-center lead ep-caption")
                            .text("Projects Table"));
                view.$el.append($header);
                var $container = $("<div></div>").addClass("row-fluid")
                        .append($("<div></div>").addClass("offset1 span10 ep-projects-table"));
                view.$el.append($container);
                view.$(".ep-projects-table").append(view.projectsTableView.$el);
                view.projectsTableView.render();
            }
            var pageModel = this.pages.get("projects.table");
            if (! pageModel) return;

            pageModel.fetchAnalysis({trackSuccess: false})
                    .onValue(doCreateTableView, this, pageModel);
            
                    
        }
    });
    return LandingPageView;
});

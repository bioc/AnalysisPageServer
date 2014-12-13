/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager", 
"views/analysis/FilterView",
"views/analysis/PageParameterView",
"views/analysis/form/PageFormSecondaryView",
"./SidebarTaggingView",
"./SidebarDownloadSectionView",
"./SidebarListView",
"bootstrap"], 
function(Backbone, TemplateManager, FilterView, PageParameterView, 
    PageFormSecondaryView, SidebarTaggingView, SidebarDownloadSectionView,
    SidebarListView) {
    var SidebarView = Backbone.View.extend({
        /**
         * @type PlotView
         */
        plotView:       null,
        /**
         * @type Backbone.View[]
         */
        children:       null,
        filters:        null,
        $accordion:     null,
        events:     {
            "click a.accordion-toggle":     "onClickToggle",
            "mouseover .accordion dt":      "onDtMouseover",
            "mouseout .accordion dt":       "onDtMouseout",
        },
        initialize: function(options) {
            this.options = _.pick(options, ["warnings"]);
            this.appModel = options.appModel;
            this.appView = options.appView;
            this.children = [];
            this.filters = [];
            this.plotView = options.plotView;
            this.eventBus = options.eventBus;
            this.tableDataModel = options.tableDataModel;
            this.settingsModel = options.settingsModel;
            this.listenTo(this.tableDataModel, "filter:complete", this.onFilterComplete);
        },
                
        initializeReactiveProperties:   function() {
            function modelAsInteractionMode(model) {
                return model.get("interactionMode");
            }
            function isTagMode(mode) {
                return mode === "tag";
            }
            var removeES = this.asEventStream("remove:before").take(1);
            var sm = this.settingsModel;
            var modeES = sm.asEventStream("change:interactionMode")
                    .map(modelAsInteractionMode)
                    .takeUntil(removeES);
            modeES
                    .filter(isTagMode)
                    .onValue(this, "activateSection", "#"+this.taggingSectionId);
            this.$el.asEventStream("click", "#"+this.taggingSectionId+"-toggle")
                    .takeUntil(removeES)
                    .onValue(sm, "set", "interactionMode", "tag");
        },
                
        render: function() {
            this.$accordion = $("<div class='accordion'></div>");
            this.$el.html(this.$accordion);
            this.options.warnings && this.renderWarnings(_.extend({
                startOpened: true
            }, _.pick(this.options, ["warnings"])));
            this.appModel.isEnv("analysis-page-server-static") || this.renderParameters({
                startOpened: ! this.options.warnings
            });
            this.renderFilters();
            this.renderTagging();
//            this.renderSteps();
//            this.renderDownloadSection();
            this.initializeReactiveProperties();
        },
        
        renderWarnings: function(opts) {
            var id = this.cid+"-warnings";
            var html = TemplateManager.render("ep-accordion-group-tmpl", {
                withInnerBody:  true,
                label:          "<span class='label label-warning'>Warnings</span>",
                chevron:        opts.startOpened ? "down" : "right",
                id:             id,
                bodyClass:      opts.startOpened ? "in" : ""
            });
            this.$accordion.append(html);
            var v = new SidebarListView({
                eventBus: this.eventBus,
                items: opts.warnings,
                itemStyle: "alert"
            });
            v.render();
            this.$("#"+id+"-placeholder").replaceWith(v.$el);
            this.children.push(v);
        },
                
        renderParameters:   function(opts) {
            var id = this.cid+"-0";
            var html = TemplateManager.render("ep-accordion-group-tmpl", {
                label:          "Analysis Parameters",
                chevron:        opts.startOpened ? "down" : "right",
                id:             id,
                bodyClass:      opts.startOpened ? "in" : ""
            });
            this.$accordion.append(html);
            var pageModel = this.model.get("aps-analysis-dataset") ? 
                            this.model.collection.parentPageModel :
                            this.model;
            var v = new PageParameterView({
                className:  "light-blue clearfix ep-sidebar-parameter-summary",
                model:      pageModel
            });
            v.render();
            this.listenToOnce(v, "toggle", this.onParametersToggle);
            this.$("#"+id+"-placeholder").replaceWith(v.$el);
            this.children.push(v);
        },
                
        renderParameterForm:   function() {
            var pageModel = this.model.get("aps-analysis-dataset") ? 
                            this.model.collection.parentPageModel :
                            this.model;
            var v = new PageFormSecondaryView({
                className:  "light-blue clearfix",
                model:      pageModel,
                appModel:   this.appModel,
                appView:    this.appView,
                eventBus:   this.eventBus
            });
            v.render();
            this.children.push(v);
            $("#"+this.cid+"-0").append(v.$el);
            v.$el.prev().hide();
        },
                
        renderFilters:  function() {
            var id = this.cid+"-1";
            var html = TemplateManager.render("ep-accordion-group-tmpl", {
                label:          "<span>Filters: None</span><span class='pull-right'>Showing All "+this.tableDataModel.get("size")+"</span>",
                withInnerBody:  true,
                chevron:    "right",
                id:         id
            });
            this.$accordion.append(html);
            var filterModels = this.tableDataModel.filters,
                    v, items = [];
            _.each(filterModels, function(model, i) {
                v = new FilterView({
                    className:  "input-prepend ep-analysis-filter",
                    model:      model
                });
                if (i > 0 && model.get("idx") === filterModels[i-1].get("idx")) {
                    items[items.length-1].placeholderId.push(v.cid);
                }
                else {
                    items.push({
                        label:  "<span class='ep-ext-label'>"+model.get("label")+"</span>"+
                                model.get("label"),
                        placeholderId:  [v.cid]
                    });
                }
                
                this.filters.push(v);
            }, this);
            var $body = this.$("#"+id);
            html = TemplateManager.render("ep-dl-tmpl", {
                horizontal: true,
                items:      items
            });
            $body.children(".accordion-inner").html(html);
            _.each(this.filters, function(filterView) {
                this.$("#"+filterView.cid).replaceWith(filterView.$el);
                filterView.render();
            }, this);
            
        },
            
        renderTagging:  function() {
            var id = this.taggingSectionId = this.cid+"-2";
            var html = TemplateManager.render("ep-accordion-group-tmpl", {
                withInnerBody:  true,
                label:          "Tag Points",
                chevron:        "right",
                id:             id
            });
            this.$accordion.append(html);
            var v = new SidebarTaggingView({
                plotView:       this.plotView,
                model:          this.settingsModel,
                tableDataModel: this.tableDataModel,
                eventBus:       this.eventBus
            });
            v.render();
            this.$("#"+id+"-placeholder").replaceWith(v.$el);
            this.children.push(v);
        },
                
        renderSteps:  function() {
            var id = this.cid+"-3";
            var html = TemplateManager.render("ep-accordion-group-tmpl", {
                label:      "Next Steps",
                chevron:    "right",
                id:         id
            });
            this.$accordion.append(html);
        },
                
        renderDownloadSection:  function() {
            var v = new SidebarDownloadSectionView({
                plotView:       this.plotView,
                eventBus:       this.eventBus,
                idPrefix:       this.cid,
                tagName:        "ul",
                className:      "inline pull-right",
                model:          this.model,
                tableDataModel: this.tableDataModel
            });
            v.render();
            this.$el.append(v.$el);
            this.children.push(v);
        },
                
        updateFilterHeaderText:    function() {
            var nbActive = _.reduce(this.filters, function(memo, filterView) {
                return memo + (filterView.model.has("value") ? 1 : 0);
            }, 0);
            // check if points on the plot were selected
            nbActive += _.size(this.tableDataModel.get("selected")) > 0 ? 1 : 0;
            var $a = this.$("#"+this.cid+"-1-toggle");
            if (nbActive > 0) {
                $a.children("span").eq(1).text("Showing "+this.tableDataModel.get("currentSize")+" of "+this.tableDataModel.get("size"));
                $a.children("span").eq(0).text("Filters: "+nbActive);
            }
            else {
                $a.children("span").eq(1).text("Showing All "+this.tableDataModel.get("size"));
                $a.children("span").eq(0).text("Filters: None");
            }
        },
               
        activateSection:    function(bodyId) {
            var $accordion = this.$(bodyId).closest(".accordion");
            $accordion.find(".accordion-body").removeClass("in");
            this.$(bodyId).addClass("in");
            var $accordionToggle = this.$(bodyId+"-toggle");
            $accordionToggle.children("i").removeClass("icon-chevron-right")
                .addClass("icon-chevron-down");
                
            $accordion.find(".accordion-toggle").not($accordionToggle.get(0))
                .children("i")
                    .addClass("icon-chevron-right")
                    .removeClass("icon-chevron-down");
        },
                
        remove: function() {
            this.trigger("remove:before");
            Backbone.View.prototype.remove.call(this);
        },
                
        onFilterComplete:   function(dataChunk, filterModel) {
            filterModel && this.filters[filterModel.get("i")].update();
            this.updateFilterHeaderText();
        },
                
        onClickToggle:      function(e) {
            e.preventDefault();
            var bodyId = this.$(e.currentTarget).attr("href");            
            this.activateSection(bodyId);
        },
        onParametersToggle: function() {
            this.renderParameterForm();
        },
        
        onDtMouseover: function(e) {
            var $dt = $(e.currentTarget);
            var $extLabel = $dt.children(".ep-ext-label");
            if ($dt.width() < $extLabel.width()) {
                $extLabel.css("visibility", "visible").addClass("label label-default");
            }
        },
        onDtMouseout: function(e) {
            var $dt = $(e.currentTarget);
            $dt.children(".ep-ext-label").css("visibility", "hidden");
        }
    });
    return SidebarView;
});
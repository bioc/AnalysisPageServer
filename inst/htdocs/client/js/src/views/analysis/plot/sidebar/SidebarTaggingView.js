/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager"], function(Backbone, TemplateManager) {
    
    var SidebarTaggingView = Backbone.View.extend({
        $dataFieldSelector: null,
        $tagBtn:    null,
        $clearBtn: null,
        events: {
            "click .ep-tag-btn":            "onTagButtonClick",
            "click .ep-clear-btn":          "onClearButtonClick",
            "click .ep-filter-tagged-btn":  "onFilterTaggedButtonClick",
            "click .ep-release-filter-btn":  "onReleaseButtonClick",
            "change select":                "onSelectorValueChange"
        },
        initialize: function(opts) {
            this.tableDataModel = opts.tableDataModel;
            this.plotView = opts.plotView;
            this.eventBus = opts.eventBus;
            this.listenTo(this.model, "change:tagCloudVisible", this.onModelCloudVisibleChanged);
        },
        render: function() {
            var meta = this.tableDataModel.get("meta");
            var extMeta = [];
            _.each(meta, function(metaItem, i) {
                var extItem = _.clone(metaItem);
                extItem.i = i;
                extMeta.push(extItem);
            });
            this.$el.html(TemplateManager.render("ep-accordion-tagging-area-tmpl", {
                meta:   extMeta
            }));
            this.$dataFieldSelector = this.$("select");
            this.$tagBtn = this.$(".ep-tag-btn");
            this.$clearBtn = this.$(".ep-clear-btn");
            this.$filterTaggedBtn = this.$(".ep-filter-tagged-btn");
            this.$releaseFilterBtn = this.$(".ep-release-filter-btn");
        },
             
        setSelectorValueFirstIfNone:  function() {
            var $selectedOpt = this.$dataFieldSelector.children(":selected"), 
                    val = parseInt($selectedOpt.attr("value"));
            if (! val) {
                this.$dataFieldSelector.children().eq(1).prop("selected", true);
                val = 0;
            }
            this.model.set("tagFieldIdx", val);
        },
                
        onSelectorValueChange:  function() {
            this.setSelectorValueFirstIfNone();
            this.eventBus.push({
                plotViewTagUpdate:  true,
                plotView:           this.plotView
            });
        },
                
        onTagButtonClick:    function(e) {
            this.$tagBtn.prop("disabled", true);
            this.setSelectorValueFirstIfNone();
            this.eventBus.push({
                plotViewTagAll:     true,
                plotView:           this.plotView
            });
        },
                
        onClearButtonClick:    function() {
            this.$tagBtn.prop("disabled", false);
            this.$filterTaggedBtn.prop("disabled", false);
            this.eventBus.push({
                plotViewTagClear:   true,
                plotView:           this.plotView
            });
        },
                
        onFilterTaggedButtonClick:  function() {
            this.tableDataModel.filterSelected();
            this.$releaseFilterBtn.prop("disabled", false);
        }, 
               
        onReleaseButtonClick:   function() {
            this.tableDataModel.cancelFilterSelected();
            this.$filterTaggedBtn.prop("disabled", false);
            this.$releaseFilterBtn.prop("disabled", true);
        },
               
        onModelCloudVisibleChanged: function(model, visible) {
            this.$clearBtn.prop("disabled", ! visible);
            this.$filterTaggedBtn.prop("disabled", ! visible || _.size(this.tableDataModel.get("selected")) === this.tableDataModel.get("currentSize"));
            this.$tagBtn.prop("disabled", false);
            this.setSelectorValueFirstIfNone();
        }
    });
    
    return SidebarTaggingView;
});
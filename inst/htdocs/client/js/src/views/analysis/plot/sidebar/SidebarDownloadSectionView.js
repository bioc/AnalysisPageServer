/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager"], function(Backbone, TemplateManager) {
    
    function same(key, ref, e) {
        return e[key] === ref;
    }
    
    var SidebarDownloadSectionView = Backbone.View.extend({
        $itemsShown:    null,
        events: {
            "click a.ep-download":     "onClickDownloadButton"
        },
        initialize: function(options) {
            this.options = _.pick(options, ["idPrefix"]);
            this.tableDataModel = options.tableDataModel;
            this.plotView = options.plotView;
            this.eventBus = options.eventBus;
            this.initializeEventBus();
            this.listenTo(this.tableDataModel, "filter:complete", this.onFilterComplete);
        },
        initializeEventBus: function() {
            this.eventBus
                    .filter(".plotViewReady")
                    .filter(same, "plotView", this.plotView)
                    .onValue(this, "enableButtons");
        },
        render: function() {
            var id = this.options.idPrefix+"-download";
            this.$el.prop("id", id);
            
            var dataSize = this.tableDataModel.get("size");
            this.$itemsShown = $(TemplateManager.render("ep-list-item-tmpl", {
                label:  "<span class='text-info'>Showing "+dataSize+"</span>",
                notA:   true
            }));
            this.$el.append(this.$itemsShown);
            var $downloadBtnGroup = $("<li></li>");
            $downloadBtnGroup.addClass("dropdown");
            var $downloadToggle = $(TemplateManager.render("ep-btn-tmpl", {
                    btnClass:   "dropdown-toggle",
                    icon:       "icon-download",
                    label:      "download <span class='caret'></span>"
                }));
            $downloadBtnGroup
                    .append($downloadToggle)
                    .append("<ul></ul>");
            var $dropdownList = $downloadBtnGroup.find("ul");
            $dropdownList.addClass("dropdown-menu");
            var $downloadAsCsvLi = $(TemplateManager.render("ep-list-item-tmpl",{
                label:  ".csv"
            }));
            $downloadAsCsvLi.find("a").addClass("ep-download ep-download-csv");
            $dropdownList.append($downloadAsCsvLi);
            var $downloadAsPngLi = $(TemplateManager.render("ep-list-item-tmpl",{
                label:  ".png"
            }));
            $downloadAsPngLi
                    .addClass("disabled")
                    .find("a").prop("disabled", true).addClass("ep-download ep-download-png");
            $dropdownList.append($downloadAsPngLi);
            var $downloadAsSvgLi = $(TemplateManager.render("ep-list-item-tmpl",{
                label:  ".svg"
            }));
            $downloadAsSvgLi
                    .addClass("disabled")
                    .find("a").prop("disabled", true).addClass("ep-download ep-download-svg");
            $dropdownList.append($downloadAsSvgLi);
            this.$el.append($downloadBtnGroup);
            $downloadToggle.dropdown();
        },
                
        updateItemsShownText:   function(current, all) {
            var text = "Showing "+current;
            if (current < all) {
                text += " (filtered out of "+all+")";
            }
            this.$itemsShown.children("span").text(text);
        },
               
        enableButtons:  function() {
            this.$("a.ep-download-png, a.ep-download-svg")
                    .prop("disabled", false)
                    .parent().removeClass("disabled");
        },
                
        onClickDownloadButton:  function(e) {
            e.preventDefault();
            var $btn = $(e.currentTarget);
            $btn.prop("disabled", true);
            if ($btn.hasClass("ep-download-csv")) {
                this.tableDataModel.saveAsCsv(this.model.get("label")+".csv", function() {
                    $btn.prop("disabled", false);
                });
            }
            else if ($btn.hasClass("ep-download-png")) {
                this.plotView.saveAsPng(this.model.get("label")+".png", function() {
                    $btn.prop("disabled", false);
                });
            }
            else if ($btn.hasClass("ep-download-svg")) {
                this.plotView.saveAsSvg(this.model.get("label")+".svg", function() {
                    $btn.prop("disabled", false);
                });
            }
        },
                
        onFilterComplete:   function(chunk, filterModel, rowIds) {
            var m = this.tableDataModel;
            this.updateItemsShownText(rowIds.length, m.get("size"));
        }
    });
    return SidebarDownloadSectionView;
});
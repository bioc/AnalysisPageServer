/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager", "polyfills/fullscreen.api", "bootstrap"], function(Backbone, TemplateManager, fullscreenApi) {
    
    function same(key, ref, e) {
        return e[key] === ref;
    }
    
    var PlotSideMenuView = Backbone.View.extend({
        $tagModeBtn:    null,
        $zoomModeBtn:   null,
        $fullscreenModeBtn: null,
        events: {
            "click button":         "onMenuButtonClick",
            "click a.ep-download":  "onClickDownloadButton"
        },
        initialize: function(opts) {
            this.tableDataModel = opts.tableDataModel;
            this.pageModel = opts.pageModel;
            this.plotView = opts.plotView;
            this.eventBus = opts.eventBus;
            this.initializeEventBus();
            $(document).on("mozfullscreenchange."+this.cid+" webkitfullscreenchange."+this.cid, $.proxy(this.onDocumentFullscreenChange, this));
            this.initializeReactiveProperties();
        },
        initializeEventBus: function() {
            this.eventBus
                    .filter(".plotViewReady")
                    .filter(same, "plotView", this.plotView)
                    .onValue(this, "enableButtons");
        },
        initializeReactiveProperties:   function() {
            function modelAsInteractionMode(model) {
                return model.get("interactionMode");
            }
            function enterMode(view, mode) {
                view["enter"+mode[0].toUpperCase()+mode.slice(1)+"Mode"]();
            }
            var es = this.model.asEventStream("change:interactionMode", modelAsInteractionMode);
            es.onValue(enterMode, this);
        },
        render: function() {
            var btns = [];
            var fullscreenBtnHtml = TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-expand fa-fw"
            });
            btns.push(TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-tags fa-fw"
            }));
            btns.push(TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-arrows fa-fw"
            }));

            var selectorMenuHtml = TemplateManager.render("ep-btn-group-tmpl", {
                vertical:   true,
                btns:       btns,
                groupClass: ""
            });
            this.$el.append(fullscreenBtnHtml);
            this.$el.append(selectorMenuHtml);
            this.$el.find("button").prop("disabled", true);
            this.$fullscreenModeBtn = this.$el.find("button").eq(0);
            this.$tagModeBtn = this.$el.find("button").eq(1);
            this.$zoomModeBtn = this.$el.find("button").eq(2);
            
            this.attachButtonPopover(this.$fullscreenModeBtn, "Toggle Fullscreen", "View your plot in full screen.");
            this.attachButtonPopover(this.$tagModeBtn, "Tag Mode", this.getTagModeDescription());
            this.attachButtonPopover(this.$zoomModeBtn, "Pan Mode", this.getZoomModeDescription());
            
            if (this.model.get("interactionMode") === "zoom") 
                this.$zoomModeBtn.addClass("active");
            else
                this.$tagModeBtn.addClass("active");
            
            this.renderZoomButtons();
            this.renderDownloadButton();
        },
                
        renderZoomButtons:  function() {
            var btns = [];
            btns.push(TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-search-plus fa-fw"
            }));
            btns.push(TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-search-minus fa-fw"
            }));
            btns.push(TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-circle-o fa-fw"
            }));
            var selectorMenuHtml = TemplateManager.render("ep-btn-group-tmpl", {
                vertical:   true,
                btns:       btns,
                groupClass: ""
            });
            this.$el.append(selectorMenuHtml);
            this.$el.find("button").prop("disabled", true);
            this.attachButtonPopover(this.$(".fa-search-plus").parent(), "Zooming", "Zoom in ('+' key)");
            this.attachButtonPopover(this.$(".fa-search-minus").parent(), "Zooming", "Zoom out ('-' key)");
            this.attachButtonPopover(this.$(".fa-circle-o").parent(), "Zooming", "Reset zoom ('0' key)");
        },
                
        renderDownloadButton:   function() {
            var btns = [];
            btns.push(TemplateManager.render("ep-btn-tmpl", {
                btnClass:   "btn-small",
                icon:       "fa fa-download fa-fw"
            }));
            var menuHtml = TemplateManager.render("ep-btn-group-tmpl", {
                vertical:   true,
                btns:       btns,
                groupClass: "dropdown"
            });
            this.$el.append(menuHtml);
            this.attachButtonPopover(this.$(".fa-download").parent(), "Download", "Download data table as .csv or plot as .png or .svg.");
            var $dropdownList = $("<ul></ul>");
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
            this.$(".btn-group").last().append($dropdownList);
            this.$(".btn-group").last().find("button").dropdown();
            this.$el.find("button").prop("disabled", true);
        },
                
        getZoomModeDescription: function() {
            return "<ul>\n\
<li>Double click or scroll wheel to zoom in.</li>\n\
<li>Drag to pan.</li>\n\
<li>Shift-double click to zoom out.</li>\n\
<li>Or use incremental zoom <i class='fa fa-search-plus'></i>, <i class='fa fa-search-minus'></i> and reset <i class='fa fa-circle-o'></i> buttons to control zoom.</li>\n\
</ul>";
        },
                
        getTagModeDescription:  function() {
            return "Choose 'Tag Mode' to add data tags and filter selected points in your plot.";
        },
                
        attachButtonPopover:    function($btn, title, content, trigger) {
            $btn.popover({
                delay:      {show: 500, hide: 0},
                trigger:    trigger ? trigger : "hover",
                title:      title,
                content:    content,
                placement:  "left",
                html:       true,
                container:  this.$el.parent()
            });
        },
                
        toggleFullscreen:   function() {
            var $btn = this.$("button").eq(0);
            if (fullscreenApi.fullscreenElement()) {
                this.model.set("fullscreenMode", true);
                $btn.addClass("active");
            }
            else {
                this.model.set("fullscreenMode", false);
                $btn.removeClass("active");
            }
        },
                
        enterTagMode:   function() {
            this.$zoomModeBtn.removeClass("active");
            // popover's destroy function does not clear possible delayed show routine
            clearTimeout(this.$tagModeBtn.data("popover").timeout);
            this.$tagModeBtn.addClass("active").popover("destroy");
            this.attachButtonPopover(this.$tagModeBtn, "Tag Mode", "You are in Tag Mode.", "manual");
            this.$tagModeBtn.popover("show");
            Bacon.later(2000, "later")
                    .doAction(this.$tagModeBtn, "popover", "destroy")
                    .onValue(this, "attachButtonPopover", this.$tagModeBtn, "Tag Mode", this.getTagModeDescription(), "hover");
        },
          
        enterZoomMode:   function() {
            // popover's destroy function does not clear possible delayed show routine
            clearTimeout(this.$zoomModeBtn.data("popover").timeout);
            this.$zoomModeBtn.addClass("active").popover("destroy");
            this.$tagModeBtn.removeClass("active");
            this.attachButtonPopover(this.$zoomModeBtn, "Pan Mode", "You are in Pan Mode.", "manual");
            this.$zoomModeBtn.popover("show");
            Bacon.later(2000, "later")
                    .doAction(this.$zoomModeBtn, "popover", "destroy")
                    .onValue(this, "attachButtonPopover", this.$zoomModeBtn, "Pan Mode", this.getZoomModeDescription(), "hover");
        },
                
        enableButtons:  function() {
            this.$("button, a").prop("disabled", false);
            this.$(".dropdown-menu li").removeClass("disabled");
        },
                
        remove: function() {
            $(document).off("."+this.cid);
            Backbone.View.prototype.remove.call(this);
        },
                
        onMenuButtonClick:  function(e) {
            var $btn = $(e.currentTarget), $i = $btn.children("i");
            if ($i.hasClass("fa-expand")) {
                if ($btn.hasClass("active")) {
                    $btn.removeClass("active");
                    this.toggleFullscreen();
                    fullscreenApi.cancelFullscreen();
                }
                else {
                    this.toggleFullscreen();
                    this.eventBus.push({
                        turnPlotFullscreen: true,
                        plotView:           this.plotView
                    });
//                    fullscreenApi.requestFullscreen(this.plotView.$el.get(0));
                }
            }
            else {
                if ($i.hasClass("fa-arrows")) {
                    this.model.set("interactionMode", "zoom");
                }
                else if ($i.hasClass("fa-tags")) {
                    this.model.set("interactionMode", "tag");
                }
                else if ($i.hasClass("fa-search-plus")) {
                    this.model.set("zoomScale", this.model.get("zoomScale")*2);
                }
                else if ($i.hasClass("fa-search-minus")) {
                    var scale = this.model.get("zoomScale");
                    scale > 1 && this.model.set("zoomScale", scale/2);
                    this.model.trigger("reset:marquee:zoom");
                }
                else if ($i.hasClass("fa-circle-o")) {
                    this.model.trigger("reset:zoom");
                }
            }
        },
                
        onClickDownloadButton:  function(e) {
            e.preventDefault();
            var $btn = $(e.currentTarget);
            $btn.prop("disabled", true);
            if ($btn.hasClass("ep-download-csv")) {
                this.tableDataModel.saveAsCsv(this.pageModel.get("label")+".csv", function() {
                    $btn.prop("disabled", false);
                });
            }
            else if ($btn.hasClass("ep-download-png")) {
                this.plotView.saveAsPng(this.pageModel.get("label")+".png", function() {
                    $btn.prop("disabled", false);
                });
            }
            else if ($btn.hasClass("ep-download-svg")) {
                this.plotView.saveAsSvg(this.pageModel.get("label")+".svg", function() {
                    $btn.prop("disabled", false);
                });
            }
        },
                
        onDocumentFullscreenChange: function() {
            this.toggleFullscreen();
        }
    });
    
    return PlotSideMenuView;
});
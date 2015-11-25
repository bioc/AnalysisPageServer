/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "bacon.model", "bootstrap"], 
function(Marionette, Bacon) {
    
    return Marionette.ItemView.extend({
        template: "#ep-analysis-plot-menu-tmpl",
        className: "btn-toolbar",
        
        ui: {
            fullscreenBtn: "[data-go-fullscreen]",
            fullscreenDesc: "[data-go-fullscreen-desc]",
            tagModeBtn: "[data-tag-mode]",
            tagModeDesc: "[data-tag-mode-desc]",
            panModeBtn: "[data-pan-mode]",
            panModeDesc: "[data-pan-mode-desc]",
            zoomInBtn: "[data-zoom-in]",
            zoomInDesc: "[data-zoom-in-desc]",
            zoomOutBtn: "[data-zoom-out]",
            zoomOutDesc: "[data-zoom-out-desc]",
            resetBtn: "[data-reset]",
            resetDesc: "[data-reset-desc]",
            downloadMenuBtn: "[data-download]",
            downloadMenuDesc: "[data-download-desc]",
            downloadCsvBtn: "[data-download-csv]",
            downloadPngBtn: "[data-download-png]",
            downloadSvgBtn: "[data-download-svg]"
        },
        
        triggers: {
            "click @ui.downloadCsvBtn": "download:csv",
            "click @ui.downloadPngBtn": "download:png",
            "click @ui.downloadSvgBtn": "download:svg"
        },
        
        events: {
            "click @ui.fullscreenBtn": "_onClickFullscreenBtn",
            "click @ui.tagModeBtn": "_onClickTagModeBtn",
            "click @ui.panModeBtn": "_onClickPanModeBtn",
            "click @ui.zoomInBtn": "_onClickZoomInBtn",
            "click @ui.zoomOutBtn": "_onClickZoomOutBtn",
            "click @ui.resetBtn": "_onClickResetBtn"
        },
        
        modelEvents: {
            "change:fullscreenMode": "_onModelChangeFullscreenMode",
            "change:interactionMode": "_onModelChangeInteractionMode"
        },
        
        initialize: function(opts) {
            
        },
        
        onShow: function() {
            this.attachButtonPopover(this.ui.fullscreenBtn, this.ui.fullscreenDesc.text());
            this.attachButtonPopover(this.ui.zoomInBtn, this.ui.zoomInDesc.text());
            this.attachButtonPopover(this.ui.zoomOutBtn, this.ui.zoomOutDesc.text());
            this.attachButtonPopover(this.ui.resetBtn, this.ui.resetDesc.text());
            this.attachButtonPopover(this.ui.downloadMenuBtn, this.ui.downloadMenuDesc.text());
            this.attachComplexPopover("panMode");
            this.attachComplexPopover("tagMode");
            this.ui.downloadMenuBtn.dropdown();
            if (this.model.get("interactionMode") === "zoom") 
                this.ui.panModeBtn.addClass("active");
            else
                this.ui.tagModeBtn.addClass("active");
        },
        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
        _onClickFullscreenBtn: function(e) {
            e.preventDefault();
            this.model.set("fullscreenMode", ! this.model.get("fullscreenMode"));
        },
        _onClickTagModeBtn: function(e) {
            this.model.set("interactionMode", "tag");
        },
        _onClickPanModeBtn: function(e) {
            this.model.set("interactionMode", "zoom");
        },
        _onClickZoomInBtn: function() {
            this.model.trigger("zoom:in");
        },
        _onClickZoomOutBtn: function() {
            this.model.trigger("zoom:out");
        },
        _onClickResetBtn: function() {
            this.model.trigger("reset:zoom");
        },
        _onModelChangeFullscreenMode: function(model, fullscreenMode) {
            this.ui.fullscreenBtn[fullscreenMode ? "addClass" : "removeClass"]("active");
        },
        _onModelChangeInteractionMode: function(model, interactionMode) {
            if (interactionMode === "zoom") {
                this.ui.panModeBtn.addClass("active");
                this.ui.tagModeBtn.removeClass("active");
                this.tagModePopoverModel.set({hide: 0});
                this.panModePopoverModel.set({
                    show: 0,
                    hide: 2000,
                    content: "You are in Pan Mode."
                });
            }
                
            else {
                this.ui.panModeBtn.removeClass("active");
                this.ui.tagModeBtn.addClass("active");
                this.panModePopoverModel.set({hide: 0});
                this.tagModePopoverModel.set({
                    show: 0,
                    hide: 2000,
                    content: "You are in Tag Mode."
                });
            }
        },
                
        attachButtonPopover: function($btn, content, trigger) {
            $btn.popover({
                delay:      {show: 500, hide: 0},
                trigger:    trigger ? trigger : "hover",
                content:    content,
                placement:  "left",
                html:       false,
                container:  this.$el.parent().parent()
            });
        },
        attachComplexPopover: function(prefix) {
            var $btn = this.ui[prefix+"Btn"];
            var $desc = this.ui[prefix+"Desc"];
            this[prefix+"PopoverModel"] = Bacon.Model();
            var mouseenterE = $btn.mouseenterE();
            var mouseleaveE = $btn.mouseleaveE();
            var source1 = mouseenterE.map({show: 500, content: $desc.html()});
            var source2 = mouseleaveE.map({hide: 0});
            this[prefix+"PopoverModel"].addSource(source1);
            this[prefix+"PopoverModel"].addSource(source2);
            this[prefix+"PopoverModel"]
                    .takeUntil(this.getDestroyES())
                    .flatMapLatest(this, "_mapToShowPopover")
                    .doAction(this, "_showComplexPopover", $btn)
                    .flatMapLatest(this, "_mapToHidePopover")
                    .onValue(this, "_hideComplexPopover", $btn);
        },
        _mapToShowPopover: function(props) {
            if (props.content) {
                return Bacon.later(props.show, props);
            }
            else {
                return props;
            }
        },
        _mapToHidePopover: function(props) {
            if (! _.isUndefined(props.hide)) {
                return Bacon.later(props.hide, props);
            }
            else {
                return props;
            }
        },
        _showComplexPopover: function($btn, props) {
            if (! _.isUndefined(props.show)) {
                $btn.popover("destroy").popover({
                    trigger:    "manual",
                    content:    props.content,
                    placement:  "left",
                    html:       true,
                    container:  this.$el.parent().parent()
                }).popover("show");
            }
        },
        _hideComplexPopover: function($btn, props) {
            if (! _.isUndefined(props.hide)) {
                $btn.popover("destroy");
            }
        },                
        enableButtons: function() {
            this.$("button, a").prop("disabled", false);
            this.$(".dropdown-menu li").removeClass("disabled");
        }
    });
});
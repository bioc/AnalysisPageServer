/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager", "views/analysis/plot/sidebar/SidebarView",
    "views/analysis/plot/PlotInnerView", "bacon",
    "functions/savePlotViewAsPng", 
    "functions/savePlotViewAsSvg", 
    "functions/requestAnimationFrame", "bootstrap"], 
function(Backbone, TemplateManager, SidebarView, PlotInnerView, 
    Bacon,
    savePlotViewAsPng, savePlotViewAsSvg) {
    var PlotView = Backbone.View.extend({
        /**
         * @type Backbone.Model
         */
        settingsModel:  null,
        /**
         * @type PlotSideMenuView
         */
        menu:           null,
        /**
         * @type PlotInnerView
         */
        inner:           null,
        /**
         * @type Array of Backbone.View objects
         */
        children:       null,
        regionClass:    "plot-point",
        /**
         * A live collection of significant points found on the plot.
         * It is established just after plot downloads and renders.
         * @type HTMLCollection
         */
        points:         null,
        /**
         * Array of active point IDs
         * @type Array
         */
        activePoints:    null,
        events:     {
            "click .popover-title .close":      "onClickPopoverClose"
        },
        initialize: function(opts) {
            this.appView = opts.appView;
            this.pageView = opts.pageView;
            this.pageModel = this.pageView.model;
            this.eventBus = opts.eventBus;
            this.appModel = opts.appView.model;
            this.children = [];
            this.initializeEventBus();
            this.initializeSettings();
            this.initializeInner();
            this.initializeSidebar(opts);
            this.initializePointDetails();
            this.listenTo(this.model, "filter:complete", this.onFilterComplete);
        },
                
        initializeEventBus: function() {
            
        },
                
        /**
         * 
         * @returns {undefined}
         */
        initializePointDetails: function() {
            function emphasizeStroke(target) {
                var $trgt = $(target);
                $trgt.data("stroke", $trgt.css("stroke"));
                $trgt.data("strokeWidth", $trgt.css("strokeWidth"));
                // if stroke isn't set then use target's fill setting
                $trgt.css("stroke") == "none" && $trgt.css("stroke", $trgt.css("fill"));
                // emphasize stroke
                var sw = parseInt($trgt.css("strokeWidth"));
                sw = sw < 1 ? 1 : sw;
                $trgt.css("strokeWidth", sw*10);
            }
            function deemphasizeStroke(target) {
                $(target).css("strokeWidth", $(target).data("strokeWidth"));
                $(target).css("stroke", $(target).data("stroke"));
            }
            function hasClass(clss, target) {
                var prop = target.className.baseVal ? target.className.baseVal : target.className;
                return prop && prop.indexOf && prop.indexOf(clss) > -1;
            }
            function toResultStream(model) {
                return function(target) {return Bacon.fromNodeCallback(model, "getRow", target.id)};
            }
            
            var innerMouseDowned = this.inner.asEventStream("mouse:downed");
            var mouseoverES = 
                    this.$el.asEventStream("mouseover.epupdatedetails");
            // mouseover event stream for plot points
            var filteredMouseoverES = 
                    mouseoverES
                    .filter(innerMouseDowned.not())
                    .map(".target")
                    .filter(".className")
                    .filter(".className.baseVal")
                    .filter(hasClass, this.regionClass);
            filteredMouseoverES
                    .onValue(emphasizeStroke);
            
            var mouseoutES = 
                    this.$el.asEventStream("mouseout.epupdatedetails");
            // mouseout event stream for plot points
            var filteredMouseoutES = 
                    mouseoutES
                    .map(".target")
                    .filter(".className")
                    .filter(".className.baseVal")
                    .filter(hasClass, this.regionClass);
            // property that provides current hovered point ID
            var targetIdProp =
                    filteredMouseoverES.map(".id")
                    .merge(mouseoutES.map(null))
                    .toProperty(null);
            // with a small delay after hovering plot point
            // perform a details fetch
            var targetDetailsResponse =
                    filteredMouseoverES
                    .delay(200)
                    .flatMapLatest(toResultStream(this.model));
            
            function idsEqual(targetId, responseId) {
                return targetId === responseId;
            }
            
            var idsEqualProp = Bacon.combineWith(idsEqual, targetIdProp, 
                    targetDetailsResponse.map(".row.id"));
            
            var filteredDetailsResponse = targetDetailsResponse
                    .filter(idsEqualProp);
            
            filteredDetailsResponse
                    .onValue(this, "renderPointDetails");
            
            filteredMouseoutES
                    .onValue(deemphasizeStroke);
            // mouseenter event stream for detail boxes
            var popoverMouseenterES = this.$el.asEventStream("mouseenter.epupdatedetails", ".popover");
            // mouseleave event stream for detail boxes
            var popoverMouseleaveES = this.$el.asEventStream("mouseleave.epupdatedetails", ".popover");;
            function pointIdFromPopoverES(e) {
                return $(e.currentTarget).data("point-id");
            }
            // used to find out if mouse cursor is over details box
            var mouseOverDetailsProp = 
                    popoverMouseenterES.map(pointIdFromPopoverES)
                    .merge(popoverMouseleaveES.map(null))
                    .toProperty(null);
//            mouseOverDetailsProp.log("mouseOverDetailsProp");
            // map mouseleave events to current values of received details ID
            // and then hide details box
            popoverMouseleaveES
                    .map(pointIdFromPopoverES)
                    .onValue(this, "hidePointDetails");
            
            var leftPointIdProp = filteredMouseoutES
                    .delay(500)
                    .map(".id")
                    .toProperty(null);
//            leftPointIdProp.log("leftPointIdProp");
            function asIdOrFalse(popoverId, leftPointId) {
                // if ids are equal then emit "false" so the listener won't hide details
                // of currently hovered popover
                // if ids aren't equal then emit id of point that was left so 
                // listener knows what popover it should hide
                return leftPointId === popoverId ? false : leftPointId;
            }
            var popoverIdEqualsPointIdProp = Bacon.combineWith(asIdOrFalse, mouseOverDetailsProp, 
                    leftPointIdProp);
            // on plot point mouseout, hide its details box only after specified delay
            // and if mouse cursor is not over details box
            popoverIdEqualsPointIdProp
//                    .log("popoverIdEqualsPointIdProp")
                    .onValue(this, "hidePointDetails");
        },
                
        initializeSettings: function() {
            this.settingsModel = new Backbone.Model({
                tagFieldIdx:        0,
                tagCloudVisible:    false,
                fullscreenMode:     false,
                zoomScale:          1,
                zoomTranslate:      [0, 0],
                interactionMode:    "zoom"// tag, zoom
            });
        },
                
        initializeSidebar:  function(opts) {
            if (! this.pageModel.get("sidebarVisible")) return;
            var s = new SidebarView(_.extend({
                plotView:       this,
                className:      "ep-analysis-sidebar span5",
                model:          this.pageModel,
                tableDataModel: this.model,
                settingsModel:  this.settingsModel,
                appModel:       this.appModel,
                appView:        this.appView,
                eventBus:       this.eventBus
            }, _.pick(opts, ["warnings"])));
            this.$el.append(s.$el);
            this.children.push(s);
        },
                
        initializeInner:    function() {
            var spanClass = this.pageModel.get("sidebarVisible") ? "span7" : "span12";
            this.inner = new PlotInnerView({
                appView:        this.appView,
                className:      "ep-plot-inner "+spanClass,
                model:          this.model,
                settingsModel:  this.settingsModel,
                plotView:       this,
                pageView:       this.pageView,
                eventBus:       this.eventBus
            });
            this.$el.append(this.inner.$el);
            this.children.push(this.inner);
        },
                
        render: function() {
//            this.appView.setPageCopy(this.options.caption);
            this.renderInner();
            _.each(this.children, function(child) {
                child.render();
            });
        },
                
        /**
         * Downloads and renders actual SVG.
         * @returns {undefined}
         */
        renderInner: function() {
            function validResponse(response) {
                return !response.responseIsError;
            }
            function doRender(view, response) {
                view.$el.append(response);
                var $svg = view.$el.children("svg");
                view.inner.$el.append($svg);
                view.points = view.$el.get(0).getElementsByClassName(view.regionClass);
            }
            var fetchPlotES = Bacon.fromPromise(this.model.fetchPlot());
            fetchPlotES
                .filter(validResponse)
                .doAction(doRender, this)
                .onValue(this.eventBus, "push", {
                    plotViewReady:  true,
                    plotView:       this
                });
        },
                
        remove: function() {
            _.each(this.children, function(child) {
                child.remove();
            });
            Backbone.View.prototype.remove.call(this);
        },
                
        innerLoaded:    function() {
            return !!this.points;
        },
                
        updatePointsDisplay:    function(points, activePoints) {
            var offset = 0, atOnce = 150, self = this;
            points = points || this.points;
            activePoints = activePoints || this.activePoints;
            function routine() {
                var baseVal;
                for (var i = offset, maxIdx = offset+atOnce; i < points.length && i < maxIdx; i++) {
                    baseVal = points[i].className.baseVal;
                    if (_.indexOf(activePoints, points[i].id) > -1) {
                        var idx = baseVal.indexOf("filtered-out");
                        idx > -1 && points[i].className.baseVal.slice(idx, idx+"filtered-out".length);
                        points[i].style.display = "block";
                    }
                    else {
                        points[i].className.baseVal = baseVal+" filtered-out";
                        points[i].style.display = "none";
                    }
                }
                offset += atOnce;
                if (offset < points.length) {
                    requestAnimationFrame(routine);
                }
            }
            requestAnimationFrame(routine);
        },
                
        hidePointDetails:   function(id) {
            if (! id) return;
            var $p = $("#"+id);
            $p.data("popover") && $p.popover("hide");
        },
                
        renderPointDetails: function(result) {
            var labels = _.map(this.model.get("meta"), function(colMeta) {
                return colMeta.label;
            });
            // DONE EXPRESSIONPLOT-316 - point details not populating correctly
            var pairs = _.map(result.row.data, function(datum, i) {
                return {label: labels[i], value: ""+datum};// prevent zeros from not displaying
            });
            var listHtml = TemplateManager.render("ep-dl-tmpl", {items: pairs, horizontal: true});
            $("#"+result.row.id).popover({
                html:       true,
                title:      "Details",
                placement:  "right",
                content:    listHtml,
                trigger:    "manual",
                container:  this.inner.$el
            }).popover("show");
            var $tip = $("#"+result.row.id).data("popover").$tip;
            $tip.data("point-id", result.row.id);
            $tip.find(".arrow").hide();
            var $closeBtn = $("<button></button>")
                    .data("point-id", result.row.id)
                    .addClass("close").html("&times;");
            $tip.find(".popover-title").prepend($closeBtn);
        },
        
        saveAsPng:  function(filename, cb) {
            var view = this;
            this.trigger("before:save:file");
            savePlotViewAsPng(this, filename, function() {
                cb && cb();
                view.trigger("after:save:file");
            });
        },
        saveAsSvg:  function(filename, cb) {
            var view = this;
            this.trigger("before:save:file");
            savePlotViewAsSvg(this, filename, function() {
                cb && cb();
                view.trigger("after:save:file");
            });
        },
        
        onFilterComplete:   function(dataChunk, filterModel, rowIds) {
            this.activePoints = rowIds;
            this.updatePointsDisplay();
        },
           
        onClickPopoverClose:    function(e) {
            var pointId = $(e.currentTarget).data("point-id");
            this.hidePointDetails(pointId);
            e.preventDefault();
        }
    });
    return PlotView;
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["jquery", "backbone", "d3", "async", "bacon", "d3.bacon", 
    "views/analysis/plot/PlotSideMenuView",
    "polyfills/fullscreen.api",
    "backbone.eventstreams", "functions/requestAnimationFrame"], 
    function($, Backbone, d3, async, Bacon, d3asEventStream, PlotSideMenuView, fullscreenApi) {
    
    function same(key, ref, e) {
        return e[key] === ref;
    }
    
    var PlotInnerView = Backbone.View.extend({
        /**
         * @type Backbone.Model
         */
        settingsModel:  null,

        width:  0,
        height: 0,
        /**
         * @type d3 selection
         */
        svg:    null,
        /**
         * @type d3 selection
         */
        surface:    null,
        /**
         * @type d3 selection
         */
        points: null,
        /**
         * @type d3 selection
         */
        brush:  null,

        events: {
            
        },
        initialize: function(opts) {
            this.eventBus = opts.eventBus;
            this.pageView = opts.pageView;
            this.plotView = opts.plotView;
            this.settingsModel = opts.settingsModel;
            this.appView = opts.appView;
            this.listenTo(this.plotView, "before:save:file", this.onBeforeSaveFile);
            this.listenTo(this.plotView, "after:save:file", this.onAfterSaveFile);
            this.listenTo(this.model, "filter:complete", this.onFilterComplete);
            this.initializeMenu();
            this.initializeEventBus();
            this.initializeReactiveProperties();
            $(document).on("mozfullscreenchange."+this.cid+" webkitfullscreenchange."+this.cid, $.proxy(this.onDocumentFullscreenChange, this));
            $(window).on("resize."+this.cid, $.proxy(this.onWindowResize, this));
            this.$el.css("min-height", "500px");
        },
   
        initializeMenu: function() {
            this.menu = new PlotSideMenuView({
                model:          this.settingsModel,
                pageModel:      this.pageView.model,
                tableDataModel: this.model,
                plotView:       this.plotView,
                eventBus:       this.eventBus,
                className:      "ep-side-menu btn-toolbar"
            });
            this.$el.append(this.menu.$el);
            this.menu.render();
        },
   
        initializeEventBus: function() {
            this.eventBus
                    .filter(".plotViewTagAll")
                    .filter(same, "plotView", this.plotView)
                    .onValue(this, "selectAll");
            this.eventBus
                    .filter(".plotViewTagClear")
                    .filter(same, "plotView", this.plotView)
                    .onValue(this, "clearTagCloud");
            this.eventBus
                    .filter(".plotViewTagUpdate")
                    .filter(same, "plotView", this.plotView)
                    .onValue(this, "updateTagCloud");
            this.eventBus
                    .filter(".turnPlotFullscreen")
                    .filter(same, "plotView", this.plotView)
                    .onValue(fullscreenApi, "requestFullscreen", this.$el.get(0));
            /*
             * Depending on network speed, either app view ready event or
             * plot ready event may come first. I need both to be sure
             * I can work with the plot
             */
            var pageViewShownES = this.eventBus
                    .filter(".pageViewShown")
                    .filter(same, "pageView", this.pageView)
                    .take(1);
            var plotViewReadyES = this.eventBus
                    .filter(".plotViewReady")
                    .filter(same, "plotView", this.plotView)
                    .take(1);
                    
            var fullyReadyProp = Bacon.combineAsArray(pageViewShownES, plotViewReadyES).take(1);
            pageViewShownES
                    .takeUntil(plotViewReadyES)
                    .onValue(this, "showProgressBar");
            fullyReadyProp.onValue(this, "initializeBasicFunctionality");
        },
   
        initializeReactiveProperties:   function() {
            // special stream indicating removal of the view object
            this.beforeRemoveES = this.asEventStream("before:remove").take(1);
            this.modeProperty = this.settingsModel.asEventStream("change:interactionMode")
                    .takeUntil(this.beforeRemoveES)
                    .map(function(model) {return model.get("interactionMode");})
                    .toProperty(this.settingsModel.get("interactionMode"));
            
            this.ctrlKeyPressed = $("body").asEventStream("keydown.ctrltest")
                    .takeUntil(this.beforeRemoveES)
                    .map(".ctrlKey")
                    .merge($("body").asEventStream("keyup.ctrltest").takeUntil(this.beforeRemoveES).map(".ctrlKey"))
                    .skipDuplicates()
                    .toProperty(false);
            this.shiftKeyPressed = $("body").asEventStream("keydown.shifttest")
                    .takeUntil(this.beforeRemoveES)
                    .map(".shiftKey")
                    .merge($("body").asEventStream("keyup.shifttest").takeUntil(this.beforeRemoveES).map(".shiftKey"))
                    .skipDuplicates()
                    .toProperty(false);
            
            this.zoomedIn = this.settingsModel
                    .asEventStream("change:zoomScale")
                    .takeUntil(this.beforeRemoveES)
                    .map(function(model) {return model.get("zoomScale") > 1;})
                    .toProperty(false);
        },
   
        initializeBasicFunctionality:   function() {
            this.hideProgressBar();
            this.svg = d3.select(this.$el.children("svg").get(0));
            this.points = this.svg.selectAll(".plot-point");
            
            // important element here is surface under which points are gathered
            this.surface = d3.select(this.$el.children("svg").children("g").first().get(0));
            // for reference to know what original plot coordinates are
            this.originalWidth = parseInt(this.svg.attr("width"));
            this.originalHeight = parseInt(this.svg.attr("height"));
            this.updateSvgDimensions();
            this.initializeStyles();
            this.initializePoints();
            this.initializeBrush();
            this.initializeZooming();
//            this.preventDefaultMacCtrlClick();
        },
   
        /**
         * canvg.js can parse only inline <style> declarations so I need to 
         * provide them here
         * @returns {undefined}
         */
        initializeStyles:   function() {
            var view = this;
            $.get($("#ep-svg-styles").attr("href")).done(function(styles) {
                view.svg.insert("style", "defs").text(styles.replace(/svg /g, ""));
            });
        },
                
        initializeBrush:    function() {
            var containerEl = this.getPlotPointImmediateParent();
            if (containerEl) {
                this.brush = containerEl.insert("g", ".plot-point");
            }
            else {
                this.brush = this.surface.append("g");
            }
            this.brush
                .attr("class", "brush")
                .style("display", "none");
            this.brushFunction = d3.svg.brush();
            this.updateBrushDimensions(this.originalWidth, this.originalHeight);
            
            var brushendStream = d3asEventStream(this.brushFunction, "brushend.epgeneral");
            var zoomModeEnabled = this.modeProperty.map(function(mode) { return mode === "zoom"; });
            
            this.shiftKeyPressed// Ctrl key was a modifier here but Mac Safari triggers context menu
                    .filter(zoomModeEnabled)
                    .map(function(yes) { return yes ? "block" : "none"; })
                    .onValue(this.brush, "style", "display");
            
            zoomModeEnabled
                    .changes()
                    .map(function(yes) { return yes ? "none" : "block"; })
                    .onValue(this.brush, "style", "display");
            
            this.brushMouseDowned = 
                    d3asEventStream(this.brush, "mousedown.epmousedowned")
                    .map(true)
                    .merge(d3asEventStream(this.brush, "mouseup.epmousedowned").map(false))
                    .toProperty(false);
            
            this.brushMouseDowned.onValue(this, "trigger", "mouse:downed");
            
            d3asEventStream(this.brush, "mousedown.eppreventpanning")
                    // prevent panning
                    .onValue(".stopPropagation");
            
            this.initializeBrushZooming();
            this.initializeBrushTagging();
            
            brushendStream
                    .doAction(function(e) { e.target.clear(); })
                    .onValue(".target", this.brush);
            
            
            this.brushFunction(this.brush);
        },
        
        initializeBrushZooming: function() {
            var brushendEventStream = d3asEventStream(this.brushFunction, "brushend.epmarqueezoom");
            var zoomModeEnabled = this.modeProperty.map(function(mode) { return mode === "zoom"; });
            
            brushendEventStream
                    .filter(zoomModeEnabled)
                    .map(function(e) { return e.target.extent(); })
                    .onValue(this, "zoomByExtent");
        },
        /**
         * Shift Key determines whether or not to also keep previous tags
         * @returns {undefined}
         */
        initializeBrushTagging: function() {
            var brushEndEventStream = d3asEventStream(this.brushFunction, "brushend.epmarqueetag");
            var tagModeEnabled = this.modeProperty.map(function(mode) { return mode === "tag"; });
            // Tag points in a region
            brushEndEventStream
                    .filter(tagModeEnabled)
                    .map(function(e) { return [e.target.extent(), e.sourceEvent.shiftKey]; })
                    .onValue(this, "selectPointsByExtent");
            // Tag individual points
            var mouseDownEventStream = 
                    d3asEventStream(this.points, "mousedown.eppointtag")
                    .filter(tagModeEnabled);

            mouseDownEventStream
                    .map(function(e) { return [e.target.id, e.shiftKey]; })
                    .onValue(this, "selectPoint");
            // Listen to model changes to selected points
            this.model.asEventStream("change:newlySelected")
                    .onValue(this, "tagPoints");
        },
        
        initializePoints:   function() {
            
            function extractStartingPoint(pathD) {
                var relevantFound = 0;
                return _.filter(pathD.split(" "), function(part) {
                    if (relevantFound === 0 && part === "M") {
                        relevantFound++;
                        return false;
                    }
                    else if (relevantFound > 0 && relevantFound < 4) {
                        relevantFound++;
                        return true;
                    }
                    else {
                        return false;
                    }
                });
            }
            
            var view = this, size = this.points.size();
            var idx = 0, batchSize = 150, lastIdx = idx+batchSize;
            
            function iteratePoints() {
                var subset = view.points.select(function(d, i) { return i >= idx && idx < lastIdx ? this : null; });
                subset.each(function(d) {
                    d.startingPoint = extractStartingPoint(d3.select(this).attr("d"));
                });
                idx = lastIdx;
                lastIdx = idx+batchSize;
                idx < size && requestAnimationFrame(iteratePoints);
            }
            
            requestAnimationFrame(iteratePoints);
            
            this.points
                .data(_.times(size, function() {
                    return {};
                }));
            
        },
                
        updateBrushDimensions:  function(width, height) {
            this.brushFunction
                    .x(d3.scale.identity().domain([0, isNaN(width) ? this.width : width]))
                    .y(d3.scale.identity().domain([0, isNaN(height) ? this.height : height]));
        },
                
        getPlotPointImmediateParent:    function() {
            return this.points && this.points.size() && d3.select(this.points.node().parentNode);
        },
                
        getZoomBehaviorTarget:  function() {
            return this.svg;
        },
        getBrushBehaviorTarget: function() {
            return this.brush;
        },
                
        initializeZooming:  function() {
            var target = this.getZoomBehaviorTarget();
            var zoomBehavior = this.zoomBehavior = d3.behavior.zoom()
                    .size([this.originalWidth, this.originalHeight])
                    .scaleExtent([1, 8]);
            
            var zoomstartStream = d3asEventStream(zoomBehavior, "zoomstart.epzoom");
            var zoomStream = d3asEventStream(zoomBehavior, "zoom.epzoom");
            var zoomendStream = d3asEventStream(zoomBehavior, "zoomend.epzoom");
            
            zoomStream
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "translateRescale");

            // emit events that notify parent view if it is allowed to display
            // point details
            d3asEventStream(target, "mousedown.epmousedowned")
                    .takeUntil(this.beforeRemoveES)
                    .map(true)
                    .merge(d3asEventStream(target, "mouseup.epmousedowned").map(false))
                    .onValue(this, "trigger", "mouse:downed");

            function setCursorStyle(style) {
                target.style("cursor", style);
            }

            setCursorStyle("zoom-in");

            var zoomInteractionPerforming =
                    zoomstartStream
                    .takeUntil(this.beforeRemoveES)
                    .map(true)
                    .merge(zoomendStream.map(false));

            zoomInteractionPerforming
                    .map(function(yes) { return yes ? "move" : "zoom-in"; })
                    .onValue(setCursorStyle);
            
            this.shiftKeyPressed
                    .changes()
                    .map(function(yes) { return yes ? "zoom-out" : "zoom-in"; })
                    .onValue(setCursorStyle);        


            this.initializeZoomKeyBindings(zoomBehavior);
            this.listenToExternalZoomChanges(zoomBehavior);
            
            zoomBehavior(target);
        },
                
        listenToExternalZoomChanges:    function(zoomBehavior) {
            var target = this.getZoomBehaviorTarget();
            var view = this;
            function dispatchEvent() {
                zoomBehavior.event(target);
            }
            function setProp(prop, v) {
                zoomBehavior[prop](v);
            }
            function adjustTranslate(settingsModel) {
                var currentTranslate = zoomBehavior.translate();
                var currentScale = settingsModel.get("zoomScale");
                var scaleFactor = currentScale / settingsModel._previousAttributes.zoomScale;
                zoomBehavior.translate([
                    currentScale === 1 ? 0 : currentTranslate[0] * scaleFactor + (view.originalWidth - (view.originalWidth * scaleFactor))/2,
                    currentScale === 1 ? 0 : currentTranslate[1] * scaleFactor + (view.originalHeight - (view.originalHeight * scaleFactor))/2
                ]);
            }

            var zoomPropChangeES = this.settingsModel
                    .asEventStream("change", /*transforming function*/function(model, v, opts) {
                        return {// I need to get to the passed options
                            m:  model,
                            o:  opts
                        };
                    })
                    .takeUntil(this.beforeRemoveES)
                    .filter(function(obj) { 
                        return _.has(obj.m.changed, "zoomScale") 
                                || _.has(obj.m.changed, "zoomTranslate"); 
                    })
                    .filter(function(obj) { return ! (obj.o && obj.o.internal); })
                    .map(".m");
            
            zoomPropChangeES
                    .filter(".changed.zoomScale")
                    .map(".attributes.zoomScale")
                    .onValue(setProp, "scale");
            zoomPropChangeES
                    .filter(".changed.zoomScale")
                    .filter(function(model) { return ! model.changed.zoomTranslate; })
                    .onValue(adjustTranslate);
            zoomPropChangeES
                    .filter(".changed.zoomTranslate")
                    .map(".attributes.zoomTranslate")
                    .onValue(setProp, "translate");
            
            zoomPropChangeES
                    .onValue(dispatchEvent);
            
            this.settingsModel
                    .asEventStream("reset:zoom")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "resetZoomPan");
            this.settingsModel
                    .asEventStream("reset:marquee:zoom")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "resetMarqueeZoom");
        },
                
        initializeZoomKeyBindings:  function() {
            var keydownStream = $("body").asEventStream("keydown.zoomkeybindings")
                    .takeUntil(this.beforeRemoveES);

            function setScale(settingsModel, factor) {
                settingsModel.set("zoomScale", settingsModel.get("zoomScale")*factor);
            }

            keydownStream
                    .filter(".shiftKey")
                    .map(".keyCode")
                    .filter(function(c) { return c === 187/*Ch,S*/ || c === 61/*FF*/; })// "+"
                    .onValue(setScale, this.settingsModel, 2);

            var minusKeyES = keydownStream
                    .map(".keyCode")
                    .filter(function(c) { return c === 189/*Ch,S*/ || c === 173/*FF*/; });// "-"

            minusKeyES
                    .filter(this.zoomedIn)
                    .onValue(setScale, this.settingsModel, 0.5);
            minusKeyES
                    .onValue(this, "resetMarqueeZoom")
            
            keydownStream
                    .map(".keyCode")
                    .filter(function(c) { return c === 48; })// "0"
                    .onValue(this, "resetZoomPan");
        },
        
        showProgressBar:  function() {
            var $progress = $("<div></div>").addClass("progress");
            $progress.html($("<div></div>").addClass("bar"));
            this.$el.append($progress);
            var $bar = $progress.children();
            var mean = this.pageView.model.localModel.get("plotFetchMeanTime");
            $bar.width(0);
            $bar.css("transitionDuration", mean+"ms");
            $bar.width("100%");
        },
               
        hideProgressBar:    function() {
            this.$el.children(".progress").remove();
        },
        
        resetMarqueeZoom:   function() {
            this.updateViewBox(0, 0, this.originalWidth, this.originalHeight);
        },
        resetZoomPan:   function() {
            this.resetMarqueeZoom();
            this.settingsModel.set({
                zoomScale:      1,
                zoomTranslate:  [0, 0]
            });
        },
        
        updateViewBox:  function(x0, y0, w, h) {
            this.svg.attr("viewBox", x0+" "+y0+" "+w+" "+h);
        },
                
        updateSvgDimensions:    function() {
            // width will always be known from the container thus
            // height is a variable we need to recalculate with original aspect ratio
            this.width = this.$el.width();
            // keep original aspect ratio
            this.height = this.width*this.originalHeight / this.originalWidth;
            this.svg && this.svg.attr("width", this.width);
            this.svg && this.svg.attr("height", this.height);
        },
        
        translateRescale:   function(obj) {
            this.settingsModel.set({
                zoomTranslate:  obj.translate,
                zoomScale:      obj.scale
            }, {internal: true});
            var t = "translate(" + obj.translate + ") " + "scale(" + obj.scale + ")";
            this.surface.attr("transform", t);
        },
      
        zoomByExtent:   function(extent) {
            var x0 = extent[0][0], y0 = extent[0][1],
                x1 = extent[1][0], y1 = extent[1][1],
                width = Math.abs(x1-x0), height = Math.abs(y1-y0);
            // do not zoom if user accidentally selects a small area
            width > 10 && height > 10 && this.updateViewBox(x0, y0, width, height);
        },
        /**
         * 
         * @param {Array} pair First element is point id. 
         * The second one is boolean indicating if previous tags stay
         * @returns {undefined}
         */
        selectPoint:    function(pair) {
            ! pair[1] && this.clearTagCloud();
            this.model.setSelectedRows([pair[0]], pair[1]);
        },
        /**
         * 
         * @param {Array} pair First element is extent as provided by d3. 
         * The second one is boolean indicating if previous tags stay
         * @returns {undefined}
         */
        selectPointsByExtent:   function(pair) {
            var extent = pair[0], ids = [];
            ! pair[1] && this.clearTagCloud();
            this.points.each(function(d) {
                (!!d.startingPoint && extent[0][0] <= d.startingPoint[0] && d.startingPoint[0] < extent[1][0] &&
                            extent[0][1] <= d.startingPoint[1] && d.startingPoint[1] < extent[1][1])
                    && ids.push(this.id);
            });
            this.model.setSelectedRows(ids, pair[1]);
        },
        /**
         * Select and in effect tag all currently visible points.
         * @returns {undefined}
         */      
        selectAll:  function() {
            function updateSelected(err, result) {
                this.model.setSelectedRows(_.map(result.rows, function(r) {
                    return r.id;
                }), true);
            }
            this.model.getActiveRows(_.bind(updateSelected, this));
        },
        /**
         * Prevent default Mac context menu action taken on Ctrl-click
         * @returns {undefined}
         */
//        preventDefaultMacCtrlClick: function() {
//            d3asEventStream(/*this.getBrushBehaviorTarget()*/d3.select("body"), "mousedown.eppreventdefaultmac")
//                .log("preventMacCtrlClick1")
//                .filter(".ctrlKey")
//                .log("preventMacCtrlClick2")
//                .onValue(".preventDefault");
//        },
        
        clearTagCloud: function() {
            this.svg.selectAll(".ep-tag-cloud").remove();
            this.settingsModel.set("tagCloudVisible", false);
            this.model.setSelectedRows([], false);
        },
        updateTagCloud: function() {
            this.svg.selectAll(".ep-tag-cloud").remove();
            // it basically triggers repaint of tags
            this.model.set("newlySelected", []);
            this.model.set("newlySelected", this.model.get("selected"));
            
        },
        /**
         * @returns {undefined}
         */
        tagPoints:  function() {
            var view = this, dataFieldIdx = this.settingsModel.get("tagFieldIdx"),
                    newlySelected = this.model.get("newlySelected");

            if (_.size(newlySelected) === 0) return;

            function renderNodesLinks(obj, callback) {
                var cloud = view.surface.append("g")
                        .attr("class", "ep-tag-cloud");
                var link = cloud.selectAll(".ep-tag-link")
                    .data(obj.links)
                    .enter().append("line")
                    .attr("class", "ep-tag-link")
                    // get computed "stroke" value so canvg.js can parse inline style
                    .style("stroke", function() { return d3.select(this).style("stroke"); });

                var drag = obj.force.drag()
                        .on("dragstart", function(d) {
                            d.fixed = true;
                        });

                var node = cloud.selectAll(".ep-tag")
                    .data(obj.nodes)
                    .enter().append("g")
                    .attr("class", "ep-tag")
                    .call(drag);
                // stop propagation of mousedown event on tags while dragging
                d3asEventStream(node, "mousedown.eppreventpanning")
                    .takeUntil(view.beforeRemoveES)
                    .onValue(".stopPropagation");
            
                node.append("text")
                    .attr("dy", ".35em")
                    .text(function(d) { return d.tagLabel; });

                obj.force.on("tick", function() {
                    link.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
                })
                .on("end", function() {
                    node.datum(function(d) { d.fixed = true; return d; });
                });
                callback(null, null);
            }
            
            function prepareForce(nodesLinks, callback) {
                var force = d3.layout.force();            
                force
                    .nodes(nodesLinks.nodes)
                    .links(nodesLinks.links)
                    .size([view.width, view.height])
                    .friction(0.7)
                    .gravity(0.05)
                    .charge(-20)
                    .start();

                callback(null, _.extend(nodesLinks, {
                    force:  force
                }));
            }
            
            function prepareDataForD3NodesLinks(rows, callback) {
                var nodes = [], tempElement = document.createElement("div"), 
                        svgPoint = null, svgPointX, svgPointY, idx = 0, rowPointIdx = 0, links = [];

                _.each(rows, function(row, i) {
                    svgPoint = view.points.filter("#"+row.id);
                    svgPointX = svgPoint.datum().startingPoint[0];
                    svgPointY = svgPoint.datum().startingPoint[1];
                    rowPointIdx = idx;
                    nodes.push({
                        x:      svgPointX,
                        y:      svgPointY,
                        fixed:  true,
                        index:  rowPointIdx
                    });
                    nodes.push({
                        index:      ++idx,
                        x:          _.random(svgPointX-20, svgPointX+20),
                        y:          _.random(svgPointY-20, svgPointY+20),
                        // get rid of possible HTML stuff like <a></a>
                        tagLabel:   $(tempElement).html(String(row.data[dataFieldIdx])).text()
                    });
                    links.push({
                        source: rowPointIdx,
                        target: idx
                    });

                    idx++;
                });

                callback(null, {
                    nodes:  nodes,
                    links:  links
                });
            }
            
            function getSelected(result, callback) {
                var subsetOfRows = _.filter(result.rows, function(row) {
                    return newlySelected && _.indexOf(newlySelected, row.id) > -1;
                });
                callback(null, subsetOfRows);
            }
            
            var composed = async.compose(
                renderNodesLinks,
                prepareForce,
                prepareDataForD3NodesLinks,
                getSelected,
                _.bind(this.model.getActiveRows, this.model)
            );
            composed(function() {
                view.settingsModel.set("tagCloudVisible", true);
                view.trigger("plot:tagging:done");
            });
        },
        
        remove: function() {
            this.trigger("before:remove");
            $(window).off("resize."+this.cid);
            $(document).off("."+this.cid);
            Backbone.View.prototype.remove.call(this);
        },
        
        onBeforeSaveFile:   function() {
            this.getBrushBehaviorTarget().style("display", "none");
        },
        onAfterSaveFile:   function() {
            this.getBrushBehaviorTarget().style("display", "block");
        },
                
        onFilterComplete:   function(dataChunk, filterModel, rowIds) {
            this.updateTagCloud();
        },
        /**
         * @returns {undefined}
         */
        onDocumentFullscreenChange: function() {
            //onWindowResize is not sufficient for Safari 6.0 as it returns 
            // wrong plot dimensions after quitting fullscreen
            this.updateSvgDimensions();
        },
        onWindowResize: function(e) {
            this.updateSvgDimensions();
        }
    });
    
    return PlotInnerView;
});
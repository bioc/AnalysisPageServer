/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "d3", "bacon", 
    "requirejs-text!./svg.css",
    "backbone.eventstreams", "polyfills/requestAnimationFrame"], 
    function(Marionette, d3, Bacon, svgStyles) {

    return Marionette.ItemView.extend({
        template: false,
        
        ui: {
            svg: "svg"
        },
        
        modelEvents: {
            "change:interactionMode": "_onModelChangeInteractionMode",
            "change:tagCloudVisible": "_onModelChangeTagCloudVisible",
            "change:fullscreenMode": "_onModelChangeFullscreenMode"
        },
        
        initialize: function(opts) {
            this.storeD3Elements();
            this.originalWidth = parseInt(this.d3.svg.attr("width"));
            this.originalHeight = parseInt(this.d3.svg.attr("height"));
            this._isWide = this.originalWidth > this.originalHeight+100;
            this._isHigh = this.originalHeight > this.originalWidth+100;
            this.initializePoints();
            this.initializeStyles();
//            $(document).on("mozfullscreenchange."+this.cid, _.bind(this.onDocumentFullscreenChange, this));
//            $(document).on("webkitfullscreenchange."+this.cid, _.bind(this.onDocumentFullscreenChange, this));
            $(window).on("resize."+this.cid, _.bind(this.onWindowResize, this));
//            this.$el.css("min-height", "500px");
        },
        storeD3Elements: function() {
            this.d3 = {};
            this.d3.svg = d3.select(this.$el.children("svg").get(0));
            this.d3.points = this.d3.svg.selectAll(".plot-point");
            // important element here is surface under which points are gathered
            this.d3.surface = d3.select(this.$el.children("svg").children("g").first().get(0));
            if (this.d3.points.size()) {
                this.d3.pointsParent = d3.select(this.d3.points.node().parentNode);
            }
        },
        onDestroy: function() {
            $(window).off("resize."+this.cid);
            $(document).off("."+this.cid);
        },
        onShow: function() {
            this.updateSvgDimensions();
        },
        getDestroyES: function() {
            return this.asEventStream("before:destroy").take(1);
        },
        
        onEmphasizePoint: function(pointId) {
            this._emphasizePointStroke(pointId);
        },
        onDeemphasizePoint: function(pointId) {
            this._deemphasizePointStroke(pointId);
        },
        _emphasizePointStroke: function(pointId) {
            var $trgt = $("#"+pointId);
            $trgt.data("stroke", $trgt.css("stroke"));
            $trgt.data("strokeWidth", $trgt.css("strokeWidth"));
            // if stroke isn't set then use target's fill setting
            $trgt.css("stroke") == "none" && $trgt.css("stroke", $trgt.css("fill"));
            // emphasize stroke
            var sw = parseInt($trgt.css("strokeWidth"));
            sw = sw < 1 ? 1 : sw;
            $trgt.css("strokeWidth", sw*10);
        },
        _deemphasizePointStroke: function(pointId) {
            var $trgt = $("#"+pointId);
            $trgt.css("strokeWidth", $trgt.data("strokeWidth"));
            $trgt.css("stroke", $trgt.data("stroke"));
        },
        isWide: function() {
            return this._isWide;
        },
        isHigh: function() {
            return this._isHigh;
        },
        /**
         * canvg.js can parse only inline <style> declarations so I need to 
         * provide them here
         * @returns {undefined}
         */
        initializeStyles:   function() {
            this.d3.svg.insert("style", "defs").text(svgStyles.replace(/svg /g, ""));
        },
         
        initializePoints: function() {
            var view = this, size = this.d3.points.size();
            var idx = 0, batchSize = 150, lastIdx = idx+batchSize;
            
            function iteratePoints() {
                var subset = view.d3.points.select(function(d, i) { return i >= idx && idx < lastIdx ? this : null; });
                subset.each(function(d) {
                    d.startingPoint = view._extractStartingPoint(d3.select(this).attr("d"));
                });
                idx = lastIdx;
                lastIdx = idx+batchSize;
                idx < size && window.requestAnimationFrame(iteratePoints);
            }
            
            this.d3.points
                .data(_.times(size, function() {
                    return {};// attach object for storing point data
                }));
            
            window.requestAnimationFrame(iteratePoints);
        },
        _extractStartingPoint: function(pathD) {
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
        },
        updatePointsDisplay: function(activePoints) {
            var offset = 0, atOnce = 150;
            var points = this.d3.points;
            function routine() {
                var p;
                for (var i = offset, maxIdx = offset+atOnce; i < points[0].length && i < maxIdx; i++) {
                    p = points[0][i];
                    if (_.indexOf(activePoints, p.id) > -1) {
                        d3.select(p).classed("filtered-out", false);
//                        p.classList.remove("filtered-out");
                        p.style.display = "block";
                    }
                    else {
                        d3.select(p).classed("filtered-out", true);
//                        p.classList.add("filtered-out");
                        p.style.display = "none";
                    }
                }
                offset += atOnce;
                if (offset < points[0].length) {
                    window.requestAnimationFrame(routine);
                }
            }
            window.requestAnimationFrame(routine);
        },
            
        updateBrushDimensions: function(width, height) {
            this.d3.brushFunction
                    .x(d3.scale.identity().domain([0, isNaN(width) ? this.width : width]))
                    .y(d3.scale.identity().domain([0, isNaN(height) ? this.height : height]));
        },      
        getZoomBehaviorTarget:  function() {
            return this.d3.svg;
        },
        getBrushBehaviorTarget: function() {
            return this.d3.brush;
        },
         
        updateViewBox: function(x0, y0, w, h) {
            this.d3.svg.attr("viewBox", x0+" "+y0+" "+w+" "+h);
        },
                
        updateSvgDimensions: function() {
            // width will always be known from the container thus
            
            if (this.model.isFullscreen()) {
                this.height = screen.height;
                this.width = screen.width;
            }
            else {// window resized or exited fullscreen
                this.width = this.$el.width();
                this.height = this.originalHeight;
                if (this.isHigh()) {
                    if (this.model.get("zoomScale") < 1) {
                        this.height *= this.model.get("zoomScale");
                    }
                }
                if (this.height < 500) this.height = 500;
            }
            
            this.d3.svg && this.d3.svg.attr("width", this.width);
            this.d3.svg && this.d3.svg.attr("height", this.height);
        },
        
        updateHeight: function(newH) {
            this.height = newH;
            this.d3.svg.attr("height", this.height);
        },
      
        clearTagCloud: function() {
            this.d3.svg.selectAll(".ep-tag-cloud").remove();
            this.model.set("tagCloudVisible", false);
//            this.model.setSelectedRows([], false);
        },
//        updateTagCloud: function() {
//            this.clearTagCloud();
//            // it basically triggers repaint of tags
////            this.model.set("newlySelected", []);
////            this.model.set("newlySelected", this.model.get("selected"));
//            this.tagPoints(true);
//        },
        onBeforeSaveFile:   function() {
            this.getBrushBehaviorTarget().style("display", "none");
        },
        onAfterSaveFile:   function() {
            this.getBrushBehaviorTarget().style("display", "block");
        },      
        onWindowResize: function(e) {
            this.updateSvgDimensions();
        },
        _onModelChangeFullscreenMode: function() {
            //onWindowResize is not sufficient for Safari 6.0 as it returns 
            // wrong plot dimensions after quitting fullscreen
            this.updateSvgDimensions();
        },
        _onModelChangeInteractionMode: function(model, mode) {
            this.d3.brush.style("display", mode === "zoom" ? "none" : "block");
        },
        _onModelChangeTagCloudVisible: function(model, visible) {
            if (! visible) this.d3.svg.selectAll(".ep-tag-cloud").remove();
        }
    });
});
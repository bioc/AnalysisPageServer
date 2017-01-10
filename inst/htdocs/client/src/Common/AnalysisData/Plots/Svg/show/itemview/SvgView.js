/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import d3 from "d3";
import Bacon from "bacon";
import svgStyles from "./svg.css!text";
import "./svg.css!less";
import "polyfills/requestAnimationFrame";

export default Marionette.ItemView.extend({
    template: false,

    ui: {
        svg: "svg"
    },

    modelEvents: {
        "change:interactionMode": "_onModelChangeInteractionMode",
        "change:tagCloudVisible": "_onModelChangeTagCloudVisible",
        "change:fullscreenMode": "_onModelChangeFullscreenMode"
    },

    initialize(opts) {
        this.storeD3Elements();
        this.originalWidth = parseInt(this.d3.svg.attr("width"));
        this.originalHeight = parseInt(this.d3.svg.attr("height"));
        this.heightWidthRatio = (this.originalHeight / this.originalWidth).toFixed(2);
        this._isWide = this.originalWidth > this.originalHeight+100;
        this._isHigh = this.originalHeight > this.originalWidth+100;
        this.initializePoints();
        this.initializeStyles();
//            $(document).on("mozfullscreenchange."+this.cid, _.bind(this.onDocumentFullscreenChange, this));
//            $(document).on("webkitfullscreenchange."+this.cid, _.bind(this.onDocumentFullscreenChange, this));
        $(window).on("resize."+this.cid, _.bind(this.onWindowResize, this));
//            this.$el.css("min-height", "500px");
    },
    storeD3Elements() {
        this.d3 = {};
        this.d3.svg = d3.select(this.$el.children("svg").get(0));
        this.d3.points = this.d3.svg.selectAll(".plot-point");
        // important element here is surface under which points are gathered
        this.d3.surface = d3.select(this.$el.children("svg").children("g").first().get(0));
        if (this.d3.points.size()) {
            this.d3.pointsParent = d3.select(this.d3.points.node().parentNode);
        }
    },
    onDestroy() {
        $(window).off("resize."+this.cid);
        $(document).off("."+this.cid);
    },
    onShow() {
        this.updateSvgDimensions();
    },

    onEmphasizePoint(pointId) {
        this._emphasizePointStroke(pointId);
    },
    onDeemphasizePoint(pointId) {
        this._deemphasizePointStroke(pointId);
    },
    _emphasizePointStroke(pointId) {
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
    _deemphasizePointStroke(pointId) {
        var $trgt = $("#"+pointId);
        $trgt.css("strokeWidth", $trgt.data("strokeWidth"));
        $trgt.css("stroke", $trgt.data("stroke"));
    },
    isWide() {
        return this._isWide;
    },
    isHigh() {
        return this._isHigh;
    },
    /**
     * canvg.js can parse only inline <style> declarations so I need to
     * provide them here
     * @returns {undefined}
     */
    initializeStyles() {
        this.d3.svg.insert("style", "defs").text(svgStyles.replace(/svg /g, ""));
    },

    initializePoints() {
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
    _extractStartingPoint(pathD) {
        var relevantFound = 0;
        return _.filter(pathD.split(" "), (part) => {
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
    updatePointsDisplay(activePoints) {
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

    updateBrushDimensions(width, height) {
        this.d3.brushFunction
                .x(d3.scale.identity().domain([0, isNaN(width) ? this.width : width]))
                .y(d3.scale.identity().domain([0, isNaN(height) ? this.height : height]));
    },
    getZoomBehaviorTarget() {
        return this.d3.svg;
    },
    getBrushBehaviorTarget() {
        return this.d3.brush;
    },

    updateViewBox(x0, y0, w, h) {
        this.d3.svg.attr("viewBox", x0+" "+y0+" "+w+" "+h);
    },

    updateSvgDimensions() {
        // width will always be known from the container thus

        if (this.model.isFullscreen()) {
            this.height = screen.height;
            this.width = screen.width;
        }
        else {// window resized or exited fullscreen
            this.width = this.$el.width();
            // some arbitrary height was provided, do not adjust it
            if (this.getOption("plotHeight") !== "auto") {
                this.height = this.getOption("plotHeight");
            }
            else {
                this.height = parseInt(this.heightWidthRatio * this.width);
            }
            // if (this.isHigh()) {
            //     var s = parseFloat(this.model.get("zoomScale").toFixed(4));
            //     if (s < 1) {
            //         this.height *= s;
            //     }
            // }
        }

        this.d3.svg && this.d3.svg.attr("width", this.width);
        this.d3.svg && this.d3.svg.attr("height", this.height);
    },

    updateHeight(newH) {
        this.height = newH;
        this.d3.svg.attr("height", this.height);
    },

    clearTagCloud() {
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
    onBeforeSaveFile() {
        this.getBrushBehaviorTarget().style("display", "none");
    },
    onAfterSaveFile() {
        this.getBrushBehaviorTarget().style("display", "block");
    },
    onWindowResize(e) {
        this.updateSvgDimensions();
    },
    _onModelChangeFullscreenMode() {
        //onWindowResize is not sufficient for Safari 6.0 as it returns
        // wrong plot dimensions after quitting fullscreen
        this.updateSvgDimensions();
    },
    _onModelChangeInteractionMode(model, mode) {
        this.d3.brush.style("display", mode === "zoom" ? "none" : "block");
    },
    _onModelChangeTagCloudVisible(model, visible) {
        if (! visible) this.d3.svg.selectAll(".ep-tag-cloud").remove();
    }
});

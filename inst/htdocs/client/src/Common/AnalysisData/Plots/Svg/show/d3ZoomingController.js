/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import d3 from "d3";
import d3asEventStream from "d3.bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:initialize-zooming", this.initializeZooming, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:initialize-zooming");
    },
    listenToModel(svgView, zoomBehavior) {
        this.listenTo(svgView.model, "change", _.partial(this._onModelChange, svgView, zoomBehavior));
        this.listenTo(svgView.model, "reset:zoom", _.partial(this.resetZoomPan, svgView, zoomBehavior));
        this.listenTo(svgView.model, "zoom:in", _.partial(this.zoomIn, svgView, zoomBehavior));
        this.listenTo(svgView.model, "zoom:out", _.partial(this.zoomOut, svgView, zoomBehavior));
        svgView.once("destroy", () => this.stopListening(svgView.model));
    },
    initializeZooming(svgView) {
        var target = svgView.getZoomBehaviorTarget();
        var zoomBehavior = d3.behavior.zoom()
                .size([svgView.originalWidth, svgView.originalHeight])
                .scaleExtent([0.1, 8]);

        this.initializeZoomKeyBindings(svgView, zoomBehavior);
        this.listenToModel(svgView, zoomBehavior);

        var zoomstartStream = d3asEventStream(zoomBehavior, "zoomstart.epzoom");
        var zoomStream = d3asEventStream(zoomBehavior, "zoom.epzoom");
        var zoomendStream = d3asEventStream(zoomBehavior, "zoomend.epzoom");

        zoomStream
                .takeUntil(svgView.getDestroyES())
                .onValue(this, "updateModelFromBehavior", svgView, zoomBehavior);

        // emit events that notify parent view if it is allowed to display
        // point details
        d3asEventStream(target, "mousedown.epmousedowned")
                .takeUntil(svgView.getDestroyES())
                .map(true)
                .merge(d3asEventStream(target, "mouseup.epmousedowned").map(false))
                .onValue(svgView, "trigger", "mouse:downed");

        this._setCursorStyle(svgView, "zoom-in");

        var zoomInteractionPerforming =
                zoomstartStream
                .takeUntil(svgView.getDestroyES())
                .map(true)
                .merge(zoomendStream.map(false));

        zoomInteractionPerforming
                .map((yes) => yes ? "move" : "zoom-in")
                .onValue(this, "_setCursorStyle", svgView);

        svgView.shiftKeyPressed
                .changes()
                .map((yes) => yes ? "zoom-out" : "zoom-in")
                .onValue(this, "_setCursorStyle", svgView);

        zoomBehavior(target);
    },

    initializeZoomKeyBindings(svgView, zoomBehavior) {
        var keydownStream = $("body").asEventStream("keydown.zoomkeybindings")
                .takeUntil(svgView.getDestroyES())
                .filter(e => {
                    return _.indexOf(
                                ["input", "textarea"],
                                e.target.tagName.toLowerCase()) === -1;
                });
        keydownStream
                .filter(".shiftKey")
                .map(".keyCode")
                .filter(c => c === 187/*Ch,S*/ || c === 61/*FF*/)// "+"
                .onValue(this, "zoomIn", svgView, zoomBehavior);

        var minusKeyES = keydownStream
                .map(".keyCode")
                .filter(c => c === 189/*Ch,S*/ || c === 173/*FF*/);// "-"

        minusKeyES
                .onValue(this, "zoomOut", svgView, zoomBehavior);

        keydownStream
                .map(".keyCode")
                .filter(c => c === 48)// "0"
                .onValue(this, "resetZoomPan", svgView, zoomBehavior);
    },
    _setCursorStyle(svgView, style) {
        svgView.getZoomBehaviorTarget().style("cursor", style);
    },
    _isZoomedIn(model) {
        return model.get("zoomScale") > 1;
    },
    _coordinates(model, point, scale) {
        return [(point[0] - model.get("zoomTranslateX")) / scale, (point[1] - model.get("zoomTranslateY")) / scale];
    },
    _point(model, coordinates, scale) {
        return [coordinates[0] * scale + model.get("zoomTranslateX"), coordinates[1] * scale + model.get("zoomTranslateY")];
    },
    _calculateTranslateWhileZooming(svgView, zoomBehavior, newScale, focalPoint) {
        var model = svgView.model;
        var tx = model.get("zoomTranslateX");
        var ty = model.get("zoomTranslateY");
        var scaleFactor = newScale / model.get("zoomScale");
        var cx = svgView.originalWidth/2, cy = svgView.originalHeight/2;
        // tx = cx + (tx - cx) * scaleFactor;
        // ty = cy + (ty - cy) * scaleFactor;
        focalPoint = focalPoint || [cx, cy];

        // console.log("_calculateTranslateWhileZooming before", [tx, ty]);
        // tx = focalPoint[0] + (tx - focalPoint[0]) * scaleFactor + (svgView.originalWidth - svgView.width);
        // ty = focalPoint[1] + (ty - focalPoint[1]) * scaleFactor + (svgView.originalHeight - svgView.height);
        // console.log("_calculateTranslateWhileZooming after", [tx, ty]);
        var translatedFocalPoint = this._point(svgView.model, this._coordinates(svgView.model, focalPoint, model.get("zoomScale")), newScale);
        var adjustedTranslate = [tx + focalPoint[0] - translatedFocalPoint[0], ty + focalPoint[1] - translatedFocalPoint[1]];
        // console.log("_calculateTranslateWhileZooming", focalPoint,
        //     translatedFocalPoint,
        //     [tx, ty],
        //     adjustedTranslate
        // );
        return adjustedTranslate;
    },
    zoomIn(svgView, zoomBehavior) {
        var target = svgView.getZoomBehaviorTarget();
        var s = svgView.model.get("zoomScale")*1.2;
        zoomBehavior.scale(s);
        zoomBehavior.translate(this._calculateTranslateWhileZooming(svgView, zoomBehavior, s));
        zoomBehavior.event(target.transition().duration(350));
    },
    zoomOut(svgView, zoomBehavior) {
        var target = svgView.getZoomBehaviorTarget();
        var s = svgView.model.get("zoomScale")*0.8;
        zoomBehavior.scale(s);
        zoomBehavior.translate(this._calculateTranslateWhileZooming(svgView, zoomBehavior, s));
        zoomBehavior.event(target.transition().duration(350));
    },
    resetZoomPan(svgView, zoomBehavior) {
        var target = svgView.getZoomBehaviorTarget();
        zoomBehavior.translate([0, 0]);
        zoomBehavior.scale(1);
        zoomBehavior.event(target.transition().duration(350));
    },
    updateModelFromBehavior(svgView, zoomBehavior, zoomingProps) {
        // round the scale - sometimes we've got 0.99 and it should be 1.0
        var s = parseFloat(zoomingProps.scale.toFixed(4));
        // console.log("updateModelFromBehavior before", s, svgView.model.get("zoomScale"));
        // if (svgView.isHigh() && ! svgView.model.isFullscreen() && s <= 1) {
        //     zoomBehavior.scale(1);
        //     s *= svgView.model.get("zoomScale");
        // }
        // console.log("updateModelFromBehavior", s, zoomingProps.translate);

        svgView.model.set({
            zoomTranslateX: zoomingProps.translate[0],
            zoomTranslateY: zoomingProps.translate[1],
            zoomScale:      s
        });
    },
    _onModelChange(svgView, zoomBehavior, model, opts) {
        var s = model.get("zoomScale"),
            tx = model.get("zoomTranslateX"),
            ty = model.get("zoomTranslateY"),
            translate;
// console.log("onModelChange", s, tx, ty, model.hasChanged("zoomScale"), model.hasChanged("zoomTranslateX"), model.hasChanged("zoomTranslateY"));
        svgView.updateSvgDimensions();

        if (svgView.isHigh() && ! model.isFullscreen() && s <= 1) {
            if (model.hasChanged("zoomScale") && model.previous("zoomScale") > 1) {
                // if (s < model.previous("zoomScale")) {console.log("zooming out");
                //     tx *= 0.99;
                //     ty *= 0.99;
                // }
                // else {console.log("zooming in");
                //     tx *= 1.01;
                //     ty *= 1.01;
                // }
                // zoomBehavior.translate([0, 0]);
                // zoomBehavior.event(svgView.getZoomBehaviorTarget().transition().duration(200));
                // translate = this._calculateTranslateWhileZooming(svgView, zoomBehavior, 1);
                // zoomBehavior.translate(translate);
                // zoomBehavior.center(d3.mouse(svgView.$el[0]));
                // console.log("TRANSLATE", translate, zoomBehavior.center());
            }
            else {
                translate = [tx, ty];
                // zoomBehavior.translate([0, 0]);

            }
            // translate = this._calculateTranslateWhileZooming(svgView, zoomBehavior, s);
            // translate = [translate[0]+svgView.originalWidth - svgView.width, translate[1]+svgView.originalHeight - svgView.height];
            // translate = [tx+svgView.originalWidth - svgView.width, ty+svgView.originalHeight - svgView.height];
            // zoomBehavior.translate(translate);
            this._applyTransform(svgView, 1, [tx, ty]);
        }
        else {
            // zoomBehavior.center(null);
            this._applyTransform(svgView, s, [tx, ty]);
        }

    },
    _applyTransform(svgView, scale, translate) {
        var t = "translate(" + translate + ") " + "scale(" + scale + ")";
        svgView.d3.surface.attr("transform", t);
    }
});

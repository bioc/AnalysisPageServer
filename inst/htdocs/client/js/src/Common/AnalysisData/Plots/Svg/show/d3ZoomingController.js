/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "d3", "d3.bacon"], 
function(Marionette, d3, d3asEventStream) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:plot:initialize-zooming", this.initializeZooming, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        listenToModel: function(svgView, zoomBehavior) {
            var self = this;
            this.listenTo(svgView.model, "change", _.partial(this._onModelChange, svgView, zoomBehavior));
            this.listenTo(svgView.model, "reset:zoom", _.partial(this.resetZoomPan, svgView, zoomBehavior));
            this.listenTo(svgView.model, "zoom:in", _.partial(this.zoomIn, svgView, zoomBehavior));
            this.listenTo(svgView.model, "zoom:out", _.partial(this.zoomOut, svgView, zoomBehavior));
            svgView.once("destroy", function() {
                self.stopListening(svgView.model);
            });
        },
        initializeZooming: function(svgView) {
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
                    .onValue(this, "updateModelFromBehavior", svgView.model);

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
                    .map(function(yes) { return yes ? "move" : "zoom-in"; })
                    .onValue(this, "_setCursorStyle", svgView);
            
            svgView.shiftKeyPressed
                    .changes()
                    .map(function(yes) { return yes ? "zoom-out" : "zoom-in"; })
                    .onValue(this, "_setCursorStyle", svgView);

            zoomBehavior(target);
        },
        
        initializeZoomKeyBindings: function(svgView, zoomBehavior) {
            var keydownStream = $("body").asEventStream("keydown.zoomkeybindings")
                    .takeUntil(svgView.getDestroyES())
                    .filter(function(e) {
                        return _.indexOf(
                                    ["input", "textarea"], 
                                    e.target.tagName.toLowerCase()) === -1;
                    });
            keydownStream
                    .filter(".shiftKey")
                    .map(".keyCode")
                    .filter(function(c) { return c === 187/*Ch,S*/ || c === 61/*FF*/; })// "+"
                    .onValue(this, "zoomIn", svgView, zoomBehavior);

            var minusKeyES = keydownStream
                    .map(".keyCode")
                    .filter(function(c) { return c === 189/*Ch,S*/ || c === 173/*FF*/; });// "-"

            minusKeyES
                    .onValue(this, "zoomOut", svgView, zoomBehavior);
            
            keydownStream
                    .map(".keyCode")
                    .filter(function(c) { return c === 48; })// "0"
                    .onValue(this, "resetZoomPan", svgView, zoomBehavior);
        },
        _setCursorStyle: function(svgView, style) {
            svgView.getZoomBehaviorTarget().style("cursor", style);
        },
        _isZoomedIn: function(model) {
            return model.get("zoomScale") > 1;
        },
        _adjustTranslateWhileZooming: function(svgView, zoomBehavior, newScale) {
            var model = svgView.model;
            var tx = model.get("zoomTranslateX");
            var ty = model.get("zoomTranslateY");
            var cx = svgView.originalWidth/2, cy = svgView.originalHeight/2;
            var scaleFactor = newScale / model.get("zoomScale");
            tx = cx + (tx - cx) * scaleFactor;
            ty = cy + (ty - cy) * scaleFactor;
            zoomBehavior.translate([tx, ty]);
        },
        zoomIn: function(svgView, zoomBehavior) {
            var target = svgView.getZoomBehaviorTarget();
            var s = svgView.model.get("zoomScale")*1.2;
            zoomBehavior.scale(s);
            this._adjustTranslateWhileZooming(svgView, zoomBehavior, s);
            zoomBehavior.event(target.transition().duration(350));
        },
        zoomOut: function(svgView, zoomBehavior) {
            var target = svgView.getZoomBehaviorTarget();
            var s = svgView.model.get("zoomScale")*0.8;
            zoomBehavior.scale(s);
            this._adjustTranslateWhileZooming(svgView, zoomBehavior, s);
            zoomBehavior.event(target.transition().duration(350));
        },
        resetZoomPan: function(svgView, zoomBehavior) {
            var target = svgView.getZoomBehaviorTarget();
            zoomBehavior.translate([0, 0]);
            zoomBehavior.scale(1);
            zoomBehavior.event(target.transition().duration(350));
        },
        updateModelFromBehavior: function(model, zoomingProps) {
            model.set({
                zoomTranslateX: zoomingProps.translate[0],
                zoomTranslateY: zoomingProps.translate[1],
                zoomScale:      zoomingProps.scale
            });
        },
        _onModelChange: function(svgView, zoomBehavior, model, opts) {
            var s = model.get("zoomScale");
            var newH,
                tx = model.get("zoomTranslateX"), 
                ty = model.get("zoomTranslateY");
            // round the scale - sometimes we've got 0.99 and it should be 1.0
            s = parseFloat(s.toFixed(4));
            
            if (svgView.isHigh() && ! model.isFullscreen()) {
                if (s >= 1) {
                    newH = svgView.originalHeight;
                }
                else {
                    newH = svgView.originalHeight * s;
                }
                if (newH >= 400) {
                    svgView.updateHeight(newH);
                }
            }
            this._applyTransform(svgView, s, [tx, ty]);
        },
        _applyTransform: function(svgView, scale, translate) {
            var t = "translate(" + translate + ") " + "scale(" + scale + ")";
            svgView.d3.surface.attr("transform", t);
        }
    });
});
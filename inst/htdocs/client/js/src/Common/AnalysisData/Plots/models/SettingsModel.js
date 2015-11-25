define(["backbone"], function(Backbone) {
    return Backbone.Model.extend({
        defaults: {
            zoomScale: 1,
            zoomTranslateX: 0,
            zoomTranslateY: 0
        },
        setDimensions: function(w, h) {
            this.set({
                width: w,
                height: h
            });
        },
        isFullscreen: function() {
            return this.get("fullscreenMode");
        }
    });
});
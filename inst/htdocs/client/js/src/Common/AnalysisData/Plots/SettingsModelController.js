/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./models/SettingsModel", "polyfills/fullscreen.api"], 
function(Marionette, SettingsModel, fullscreenApi) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("analysis-data:models:plot:settings", this.getModel, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getModel: function(plotView) {
            var self = this;
            var model = new SettingsModel({
                tagFieldIdx:        0,
                tagCloudVisible:    false,
                fullscreenMode:     false,
                zoomScale:          1,
                zoomTranslateX:     0,
                zoomTranslateY:     0,
                interactionMode:    "zoom"// tag, zoom
            });
            this.listenTo(model, "change:fullscreenMode", _.partial(this._onChangeFullscreenMode, plotView));
            plotView.once("destroy", function() {
                self.stopListening(model);
                model.stopListening();
            });
            $(document).on("mozfullscreenchange."+plotView.cid+
                    " webkitfullscreenchange."+plotView.cid, 
                    _.bind(this.onDocumentFullscreenChange, this, model));
            
            return model;
        },
        onDocumentFullscreenChange: function(model) {
            model.set("fullscreenMode", fullscreenApi.fullscreenElement());
        },
        _onChangeFullscreenMode: function(plotView, model, isOn) {
            if (isOn) {
                fullscreenApi.requestFullscreen(plotView.ui.main[0]);
            }
            else {
                fullscreenApi.cancelFullscreen();
            }
        }
    });
});
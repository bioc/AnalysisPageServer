/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import SettingsModel from "./models/SettingsModel";
import fullscreenApi from "polyfills/fullscreen.api";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:models:plot:settings", this.getModel, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:models:plot:settings");
    },
    getModel(plotView) {
        var model = new SettingsModel({
            tagFieldIdx:        0,
            tagCloudVisible:    false,
            fullscreenMode:     false,
            zoomScale:          1,
            zoomTranslateX:     0,
            zoomTranslateY:     0,
            interactionMode:    "zoom"// tag, zoom
        });
        this.listenTo(model, "change:fullscreenMode", (model, isOn) => this._onChangeFullscreenMode(plotView, model, isOn));
        plotView.once("destroy", () => {
            this.stopListening(model);
            model.stopListening();
        });
        $(document).on("mozfullscreenchange."+plotView.cid+
                " webkitfullscreenchange."+plotView.cid,
                _.bind(this.onDocumentFullscreenChange, this, model));

        return model;
    },
    onDocumentFullscreenChange(model) {
        model.set("fullscreenMode", fullscreenApi.fullscreenElement());
    },
    _onChangeFullscreenMode(plotView, model, isOn) {
        if (isOn) {
            fullscreenApi.requestFullscreen(plotView.ui.main[0]);
        }
        else {
            fullscreenApi.cancelFullscreen();
        }
    }
});

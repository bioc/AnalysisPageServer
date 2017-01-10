/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import app from "app";
import SideMenuView from "./itemview/SideMenuView";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:menu", this.getView, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:menu");
    },
    getView(plotView, settingsModel) {
        let pageModel = plotView.model.pageModel;
        let v = new SideMenuView({
            model: settingsModel
        });
        v.once("render", () => this._onViewRender(v, pageModel));
        app.channel.request("analysis-data:table:initialize-save-as", plotView.model, v);
        return v;
    },
    _onViewRender(v, pageModel) {
        if (! pageModel.get("plotZoomable")) {
            v.ui.zoomInBtn.hide();
            v.ui.zoomOutBtn.hide();
            v.ui.resetBtn.hide();
        }
    }
});

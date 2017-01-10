/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
// import app from "app";
import ShowController from "./show/SvgShowController";
import PointDetailsShowController from "./show/PointDetailsShowController";
import d3BrushController from "./show/d3BrushController";
import d3BrushZoomingController from "./show/d3BrushZoomingController";
import d3BrushTaggingController from "./show/d3BrushTaggingController";
import d3TagsShowController from "./show/d3TagsShowController";
import d3ZoomingController from "./show/d3ZoomingController";
import DownloadController from "./download/SvgDownloadController";

var module = {
    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        module.showC = new ShowController();
        module.pointDetailsC = new PointDetailsShowController();
        module.brushC = new d3BrushController();
        module.brushZoomingC = new d3BrushZoomingController();
        module.brushTaggingC = new d3BrushTaggingController();
        module.tagsC = new d3TagsShowController();
        module.zoomingC = new d3ZoomingController();
        module.downloadC = new DownloadController();
    },
    stop() {
        if (! this.isStarted) return;
        this.isStarted = false;
        module.showC.destroy();
        module.pointDetailsC.destroy();
        module.brushC.destroy();
        module.brushZoomingC.destroy();
        module.brushTaggingC.destroy();
        module.tagsC.destroy();
        module.zoomingC.destroy();
        module.downloadC.destroy();
    }
};

// app.on("before:start", () => {
//     module.showC = new ShowController();
//     module.pointDetailsC = new PointDetailsShowController();
//     module.brushC = new d3BrushController();
//     module.brushZoomingC = new d3BrushZoomingController();
//     module.brushTaggingC = new d3BrushTaggingController();
//     module.tagsC = new d3TagsShowController();
//     module.zoomingC = new d3ZoomingController();
//     module.downloadC = new DownloadController();
// });
// app.on("destroy", () => {
//     module.showC.destroy();
//     module.pointDetailsC.destroy();
//     module.brushC.destroy();
//     module.brushZoomingC.destroy();
//     module.brushTaggingC.destroy();
//     module.tagsC.destroy();
//     module.zoomingC.destroy();
//     module.downloadC.destroy();
// });

export default module;

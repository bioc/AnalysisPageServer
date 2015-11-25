/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app", "./show/SvgShowController", 
    "./show/PointDetailsShowController", "./show/d3BrushController",
    "./show/d3BrushZoomingController", "./show/d3BrushTaggingController",
    "./show/d3TagsShowController", "./show/d3ZoomingController",
    "./download/SvgDownloadController"], 
    function(Marionette, app, ShowController, PointDetailsShowController,
    d3BrushController, d3BrushZoomingController, d3BrushTaggingController,
    d3TagsShowController, d3ZoomingController, DownloadController) {
    var module = app.module("Common.AnalysisData.Plots.Svg");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.showC = new ShowController();
        this.pointDetailsC = new PointDetailsShowController();
        this.brushC = new d3BrushController();
        this.brushZoomingC = new d3BrushZoomingController();
        this.brushTaggingC = new d3BrushTaggingController();
        this.tagsC = new d3TagsShowController();
        this.zoomingC = new d3ZoomingController();
        this.downloadC = new DownloadController();
    });
    return module;
});
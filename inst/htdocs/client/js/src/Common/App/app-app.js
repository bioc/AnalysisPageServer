/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "app",
    "./show/AppShowController", "./show/ModalShowController", "./AppModelController",
    "./Header/header-app"], 
function(Marionette, app, AppShowController, ModalShowController, AppModelController) {
    var module = app.module("Common.App");
    var globalReqRes = Backbone.Wreqr.radio.channel("global").reqres;
    
    module.on("start", function() {
        this.appModelC = new AppModelController();
        this.modalShowC = new ModalShowController();
        this.appShowC = new AppShowController({
            appView: null,
            modalController: this.modalShowC
        });
    });
    return module;
});
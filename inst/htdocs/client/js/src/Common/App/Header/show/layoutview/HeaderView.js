/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "config", "bootstrap"], 
function(Marionette, config) {
    return Marionette.LayoutView.extend({
        
        template: false,
        el: "header",
        
        regions: {
            rightNav: ".nav.pull-right"
        },
        
        ui: {
            brand: "a.brand",
            helpLink: "#ep-header-help a",
            subtitle: "p.navbar-text"
        },
        
        triggers: {
            "click @ui.brand": "click:brand"
//            "click @ui.helpLink": "click:help"
        },
        
        initialize: function(opts) {
//            this.initializeReactiveProperties();
            opts.fixedTop && this.$el.addClass("navbar-fixed-top");
        },
        onRender: function() {
            this.ui.helpLink.attr("href", config["help.link"]);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },                 
        setSubtitle: function(subtitle) {
            this.ui.subtitle.text(subtitle);
        }
    });
});
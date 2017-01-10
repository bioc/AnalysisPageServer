/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "./ep-navbar.less!";
import Marionette from "marionette";
import config from "config";
import "bootstrap";

export default Marionette.LayoutView.extend({

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
    },

    initialize: function(opts) {
        opts.fixedTop && this.$el.addClass("navbar-fixed-top");
    },
    onRender: function() {
        this.ui.helpLink.attr("href", config["help.link"]);
    },
    setSubtitle: function(subtitle) {
        this.ui.subtitle.text(subtitle);
    }
});

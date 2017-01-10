/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "./ep-vars.less!";
import "./ep-general.less!";
import "./ep-load-indicators.less!";

import $ from "jquery";
import _ from "underscore";
import Backbone from "backbone";
import Bacon from "bacon";
import config from "config";
import "bootstrap";

export default Backbone.Marionette.LayoutView.extend({
    template: false,
    el: "body",

    regions: {
        header: "header",
        main: "[data-main-region]",
        footer: "footer",
        modal: "[data-modal-region]"
    },

    events: {
        "keydown": "onKeydown"
    },

    initialize: function(opts) {
        this.title = opts.title;
        this.pageTitlePrefix = opts.pageTitlePrefix;
//            $(window).on("error", _.bind(this.onError, this));
    },

    setWithNavbarFixedTop: function(yes) {
        this.$el[yes ? "addClass" : "removeClass"]("with-navbar-fixed-top");
    },

    setTitle: function(newTitle) {
        document.title = newTitle;
    },

    setPageCopy: function(copy) {
        $("#ep-analysis-page-copy-row > .span7").html(copy);
    },

    /**
     * Prevents accidental Backspace that moves back in History
     * @param {type} e
     * @returns {undefined}
     */
    onKeydown: function(e) {
        if (e.which === 8 && _.indexOf(["INPUT", "TEXTAREA"], e.target.tagName) === -1) {
            e.preventDefault();
        }
    },
    onError: function(e) {
//            console.log("AppView.onError", e);
//            alert(e.message);
    }
});

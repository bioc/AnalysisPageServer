/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import jst from "./modalTemplate.html!jst";
import "bootstrap";

export default Marionette.LayoutView.extend({
    template: jst,

    className: "modal",

    regions: {
        body: "[data-body-region]"
    },

    ui: {
        moreBtn: ".more",
        closeBtn: ".close",
        primaryBtn: "[data-primary]",
        cancelBtn: "[data-cancel]",
        altBtn: "[data-alt-1]",
        progress: ".progress"
    },

    events: {
        "shown": "onModalShown",
        "click @ui.moreBtn": "onClickMore",
        "click @ui.closeBtn": "onClickClose",
        "click @ui.primaryBtn": "onClickBtnPrimary",
        "click @ui.cancelBtn": "onClickBtnCancel",
        "click @ui.altBtn": "onClickBtnAlt"
    },

    triggers: {
        "hidden": "hidden"
    },

    options: {
        withClose: false,
        cancelBtnLabel: false,
        doBtnLabel: false,
        progressBar: false,
        altBtnLabel: false
    },

    templateHelpers: function() {
        return this.options;
    },
    onShow: function() {
        this.$el.modal(_.defaults(this.options, {
            backdrop:   "static",
            keyboard:   false
        }));
    },
    onDestroy: function() {
        this.$el.modal("hide");
    },
    hide: function() {
        this.$el.modal("hide");
    },
    runProgressBar: function() {
        var $progressBar = this.ui.progress;
        var $bar = $progressBar.children();
        var mean = parseInt(this.getOption("progressBar")) || 1000;
        $bar.css("transitionDuration", mean+"ms");
        $bar.width("100%");
    },
    onModalShown: function() {
        if (this.getOption("progressBar")) this.runProgressBar();
    },
    onClickMore: function(e) {
        e.preventDefault();
        this.$(".modal-body .hide").removeClass("hide");
    },
    onClickClose: function(e) {
        e.preventDefault();
        this.hide();
    },
    onClickBtnPrimary: function() {
        this.trigger("do:primary:action", {view: this});
        this.hide();
    },
    onClickBtnCancel: function(e) {
        e.preventDefault();
        this.trigger("do:cancel:action", {view: this});
        this.hide();
    },
    onClickBtnAlt: function(e) {
        e.preventDefault();
        this.trigger("do:alt:action", {view: this});
        this.hide();
    }
});

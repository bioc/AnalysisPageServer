/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import "bootstrap";

export default Marionette.Behavior.extend({
    ui: {
        toggle: ".accordion-toggle",
        toggleIcon: ".accordion-toggle i",
        body: ".accordion-body"
    },

    events: {
        "click @ui.toggle": "_onClickToggle",
        "show @ui.body": "_onBodyShow",
        "hide @ui.body": "_onBodyHide"
    },

    onRender: function() {
        this.ui.body.collapse({
            parent: this.$el.parent(),
            toggle: false
        });
    },

    onDestroy: function() {
        delete this.ui.body.data("collapse");
        this.ui.body.removeData("collapse");
    },

    onOpenAccordion: function() {
        this.ui.body.collapse("show");
    },

    _onClickToggle: function(e) {
        e.preventDefault();
        this.ui.body.collapse("toggle");
    },
    _onBodyShow: function() {
        this.view.trigger("accordion:toggle", true);
        this.ui.toggleIcon.addClass("icon-chevron-down")
                .removeClass("icon-chevron-right");
    },
    _onBodyHide: function() {
        this.view.trigger("accordion:toggle", false);
        this.ui.toggleIcon.addClass("icon-chevron-right")
                .removeClass("icon-chevron-down");
    }
});

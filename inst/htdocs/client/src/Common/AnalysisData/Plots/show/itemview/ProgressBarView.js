/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import "bootstrap";
import "velocity/velocity.ui";

export default Marionette.ItemView.extend({
    template: _.template('<div class="bar"></div>'),
    className: "progress",

    ui: {
        bar: ".bar"
    },

    onAttach: function() {
        this.ui.bar.css("transitionDuration", this.getOption("duration")+"ms");
        this.ui.bar.width("100%");
    },

    setWithError: function() {
        this.$el.addClass("progress-danger");
        this.ui.bar.html(
                $("<p>")
                .addClass("text-center")
                .hide()
                .text("There was an error retrieving the plot.")
                );
        $.Velocity.animate(this.$("p"), "transition.slideDownIn", {delay: 200});
    }
});

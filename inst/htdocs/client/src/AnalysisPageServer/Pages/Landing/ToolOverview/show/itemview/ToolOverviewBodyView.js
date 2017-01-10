/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import $ from "jquery";
import _ from "underscore";
import jst from "./bodyTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,
    className: "",

    events: {
        "click .media": "_onClickItem"
    },

    templateHelpers: {
        _
    },

    showDesc: function(name) {
        this.$el.children().hide()
            .filter('[data-name="'+name+'"]').show();
    },

    hideToolDescs:  function() {
        this.$el.children().hide();
    },

    _onClickItem: function(e) {
        e.preventDefault();
        var $a = $(e.currentTarget);
        this.trigger("click:item", $a.attr("data-name"));
    }
});

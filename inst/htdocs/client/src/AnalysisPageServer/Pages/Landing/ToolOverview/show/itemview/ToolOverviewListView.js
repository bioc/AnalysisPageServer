/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import jst from "./listTemplate.html!jst";

export default Marionette.ItemView.extend({
    template: jst,
    tagName: "ul",
    className: "nav nav-list",

    events: {
        "click a": "_onClickItem",
        "mouseenter a": "_onMouseenterItem"
    },

    templateHelpers: {
        _
    },

    markFirstItemActive: function() {
        this.$("a").first().trigger("mouseenter");
    },

    _onClickItem: function(e) {
        e.preventDefault();
        var $a = $(e.currentTarget);
        this.trigger("click:item", $a.attr("data-name"));
    },

    _onMouseenterItem:   function(e) {
        var $a = $(e.currentTarget);
        $a.parent().siblings().removeClass("active");
        $a.parent().addClass("active");
        this.trigger("mouseenter:item", $a.attr("data-name"));
    }
});

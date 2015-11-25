/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.ItemView.extend({
        template: "#ep-tool-overview-list-tmpl",
        tagName: "ul",
        className: "nav nav-list",
        
        events: {
            "click a": "_onClickItem",
            "mouseenter a": "_onMouseenterItem"
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
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.ItemView.extend({
        template: "#ep-tool-overview-body-tmpl",
        className: "",
        
        events: {
            "click .media": "_onClickItem"
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
});
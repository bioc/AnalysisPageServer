/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager"], function(Backbone, TemplateManager) {
    return Backbone.View.extend({
        initialize: function(opts) {
            _.extend(this, _.pick(opts, ["items", "itemStyle"]));
            this.items = opts.items;
            
        },
        render: function() {
            var $list = $("<ul></ul>").addClass("unstyled");
            _.each(this.items, function(item) {
                $list.append($("<li></li>")
                        .append($("<div></div>")
                                .addClass(this.itemStyle)
                                .html(item)
                                ));
            }, this);
            this.$el.html($list);
        }
    });
});
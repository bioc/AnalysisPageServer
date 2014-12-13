/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager"], 
function(Backbone, TemplateManager) {
    var ArrayListView = Backbone.View.extend({
        /**
         * @type Boolean
         */
        rendered:   false,
        children:   null,
        initialize: function(opts) {
            _.extend(this, _.pick(opts, [
                "pageView", "pageModel", "appView", "definition",
                "createAnalysisEntryView", "eventBus"
            ]));

            this.children = [];
        },
        initializeEventBus: function() {

        },
        render: function() {
            if (this.rendered) return;
            var options = _.pick(this, [
                "pageModel", "pageView", "model", "appView", "eventBus"
            ]);
            options.parent = this;
            var itemView, $entryLabel, $entryDef;
            _.each(this.definition.value, function(itemDef) {
                itemView = this.createAnalysisEntryView(itemDef, _.clone(options));
                this.children.push(itemView);
                $entryLabel = $("<dt></dt>").html(itemDef.label);
                $entryDef = $("<dd></dd>").append(itemView.$el);
                this.$el.append($entryLabel).append($entryDef);
                itemView.render();
            }, this);
            this.rendered = true;
        },
                
        remove: function() {
            _.each(this.children, function(child) {
                child.remove();
            });
            Backbone.View.prototype.remove.call(this);
        }
    });
    return ArrayListView;
});
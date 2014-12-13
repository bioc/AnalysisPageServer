/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager", 
    "bootstrap"], 
    function(Backbone, TemplateManager) {
    var ArrayTabsView = Backbone.View.extend({
        events:     {
            "shown .nav-tabs a[data-toggle='tab']":  "onTabShown"
        },
        parent:     null,
        children:   null,
        initialize: function(opts) {
            _.extend(this, _.pick(opts, [
                "pageView", "pageModel", "appView", "definition",
                "createAnalysisEntryView", "eventBus"
            ]));
            
            this.children = [];
        },
        render: function() {
            var a = this.definition, view = this,
                content = [], itemView,
                tabs = [];
        
            var options = _.pick(this, [
                "pageModel", "pageView", "model", "appView", "eventBus"
            ]);
            options.parent = this;
        
            _.each(a.value, function(itemDef, i) {
                itemView = this.createAnalysisEntryView(itemDef, _.clone(options));
                this.children.push(itemView);
//                itemView.render();
                tabs.push({
                    active:     i === 0,
                    key:        itemView.cid,
                    label:      itemDef.label
                });
                content.push({
                    key:        itemView.cid,
                    active:     i === 0,
                    html:       ""
                });
            }, this);

            var h = TemplateManager.render("ep-analysis-array-tabs-tmpl", {
                tabs:       tabs,
                content:    content
            });
            
            this.$el.html(h);
            
            this.$el.children(".tab-content").children(".tab-pane").each(function(i) {
                $(this).append(view.children[i].$el);
            });
            
            this.children.length && this.children[0].render();
        },
        remove: function() {
            _.each(this.children, function(child) {
                child.remove();
            });
            Backbone.View.prototype.remove.call(this);
        },
                
        onTabShown:  function(e) {
            var $a = $(e.target);
            var i = $a.parent().index();
            this.children[i] && this.children[i].render();
        }
    });
    return ArrayTabsView;
});
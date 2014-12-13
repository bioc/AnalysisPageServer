/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * It renders parameter values as uneditable list.
 * Present at first in sidebar after loading analysis plot response.
 */
define(["backbone", "bacon", "TemplateManager"], function(Backbone, Bacon, TemplateManager) {
    
    function renderValue(model) {
        var v = model.get("readable") || model.get("value");
        if (_.isBoolean(v)) {
            return v ? "true" : "false";
        }
        else {
            return _.isArray(v) ? (v || []).join("<br/>") : v;
        }
    }
    
    /**
     * 
     * @param {type} collection
     * @param {type} models
     * @param {type} activeArray
     * @returns {String}
     */
    function renderInternal(collection, models, activeArray) {
        var items = [];
        _.each(models, function(model, i) {
            // DO NOT display conditionally inactive models: show.if, advanced etc.
            var modelIndex = collection.indexOf(model);
            if (! activeArray[modelIndex]) return;
            switch (model.get("type")) {
                case "compound":
                    items.push({
                        label:  model.get("label"),
                        value:  renderInternal(collection, model.children, activeArray)
                    });
                    break;
                case "array":
                    items.push({
                        label:  model.get("label"),
                        value:  renderInternal(collection, model.children, activeArray)
                    });
                    break;
                default:
                    var label = model.get("label");
                    if (model.parent) {
                        if (model.parent.get("type") === "array")
                            label = "#"+(i+1);
                    }
                    items.push({
                        label:  label,
                        value:  renderValue(model)
                    });
            }
        });   
        return TemplateManager.render("ep-dl-tmpl", {
            horizontal: ! (models.length && models[0].parent),
            items:      items
        });
    }
    
    var PageParameterView = Backbone.View.extend({
        events: {
            "click button.btn-warning": "onModifyClick"
        },
        initialize: function(opts) {
            this.noModify = opts.noModify;
        },
        _renderRoots: function(activeArray) {
            var coll = this.model.parameters;
            this.$el.prepend(renderInternal(coll, coll.getRoots(), activeArray));
        },
        render: function() {
            Bacon.combineAsArray(
                    // have to test for activity this way
                    // as parameters can now call display.callback
                    this.model.parameters.map(function(model) {
                        return model.isActive().take(1);
                    })
                    )
                    .take(1)
                    .onValue(this, "_renderRoots");
            if (! this.noModify) {
                this.$el.append(TemplateManager.render("ep-btn-tmpl", {
                    btnClass: "btn-warning pull-right ep-modify", 
                    label: "Modify"
                }));
            }
        },
        onModifyClick:  function() {
            this.trigger("toggle");
        }
    });
    return PageParameterView;
});
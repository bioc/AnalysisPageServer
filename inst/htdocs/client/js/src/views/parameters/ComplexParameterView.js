/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["bacon", "views/parameters/ParameterView"], function(Bacon, ParameterView) {
    var ComplexParameterView = ParameterView.extend({
        initialize: function(opts) {
            ParameterView.prototype.initialize.apply(this, arguments);
            this.factory = opts.factory;
        },
        render: function() {
            ParameterView.prototype.render.call(this);
        },
        renderChildren: function() {
            _.each(this.model.children, function(childModel) {
                this.addChildView(childModel);
            }, this);
        },
        /**
         * Acts only on view of child parameter.
         * @returns {undefined}
         */
        addChildView:   function(model, opts) {
            opts = _.extend({
                parent:     this,
                type:       this.getType(),
//                tabindex:   this.options.tabindex + this.children.length + 1,
                eventBus:   this.eventBus,
                appView:    this.appView
            }, opts);
            var v = this.factory.create(model, opts);
            this.children.push(v);
            v.render();
            this.$el.append(v.$el);
        },
        startsNewLine:  function() {
            return this.isPrimary();
        },
        fadeIn:     function(opts) {
            opts = opts || {};
            ParameterView.prototype.fadeIn.call(this, opts);
            if (opts.allActive) {
                _.each(this.children, function(childView) {
                    childView.fadeIn(opts);
                });
            }
            else {// only first faded out
                var fadedOutChild = _.find(this.children, function(childView) {
                    return childView.isFadedOut();
                });
                fadedOutChild && fadedOutChild.fadeIn();
            }
        },
        fadeOut:    function() {
            ParameterView.prototype.fadeOut.call(this);
            _.each(this.children, function(childView) {
                childView.fadeOut();
            });
        },
        isFadedOut: function() {
            return _.reduce(this.children, function(isFadedOut, childView) {
                return isFadedOut || childView.isFadedOut();
            }, ParameterView.prototype.isFadedOut.call(this));
        },
//        toggle: function(active) {
//            ParameterView.prototype.toggle.call(this, active);
//            // propagate to children as their activity may have changed
//            Bacon.combineAsArray(_.map(this.children, function(childView) {
//                return childView.model.isActive().take(1);
//            }))
//            .take(1)
//            .onValue(this, "_reduceActivityArray");
//        },
//        _reduceActivityArray: function(activityArray) {
//            _.each(this.children, function(childView, i) {
//                childView.toggle(activityArray[i]);
//            });
//        },
        remove: function() {
            _.each(this.children, function(childView) {
                childView.remove();
            });
            ParameterView.prototype.remove.apply(this, arguments);
        }
    });
    return ComplexParameterView;
});
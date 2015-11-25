/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Base type from which all Parameter types should inherit.
 */
define(["marionette"], function(Marionette) {
    return Marionette.Behavior.extend({
       
        getDestroyES: function() {
            return this.view.asEventStream("before:destroy").take(1);
        },
        
        onRender: function() {
            if (this.startsNewLine()) this.$el.addClass("ep-starts-line");
            this.view.model.isActive()
                    .takeUntil(this.getDestroyES())
                    .onValue(this, "toggle");
        },
        /**
         * Returns true if this view should start new line on the form.
         * @returns {Boolean}
         */
        startsNewLine: function() {
            if (this.view.model.isComplex()) return true;
            if (this.view.getOption("type") === "primary") {
                var parent = this.view.parent, siblings = parent && parent.children;
                var viewIdx = siblings && _.indexOf(siblings, this);
                var prevView = viewIdx > 0 &&  siblings && siblings.at(viewIdx-1);
                return prevView && prevView.model.isComplex();
            }
            return false;
        },
        toggle: function(show) {
            this.$el[show ? "removeClass" : "addClass"]("hide");
        },
        isHidden:   function() {
            return this.$el.hasClass("hide");
        }
    });
});
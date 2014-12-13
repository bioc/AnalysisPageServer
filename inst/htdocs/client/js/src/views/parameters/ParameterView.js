/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * Base type from which all Parameter types should inherit.
 */
define(["backbone"], function(Backbone) {
    var ParameterView = Backbone.View.extend({
        initialize: function(opts) {
            this.options = _.pick(opts, ["arrayChild"]);
            this.parent = opts.parent;
            this.type = opts.type;
            this.appView = opts.appView;
            this.eventBus = opts.eventBus;
            this.beforeRemoveES = this.asEventStream("before:remove");
            this.model.isInitialized
                    .filter(_.isEqual, true)
                    .takeUntil(this.getRemoveES())
                    .take(1)
                    .onValue(this, "onModelInitialized");
        },
        
        onModelInitialized: function() {
            // the container form is kept in sync with changes in ParameterCollection
            this.eventBus && this.eventBus.push({
                parameterViewCreated:   true,
                at:     this.model.collection.indexOf(this.model),
                view:   this
            });
            this.model.isActive()
                    .takeUntil(this.getRemoveES())
                    .onValue(this, "toggle");
        },
        
        getRemoveES: function() {
            return this.asEventStream("before:remove").take(1);
        },
        
        remove: function() {
            this.trigger("before:remove");
            // the container form is kept in sync with changes in ParameterCollection
            this.eventBus && this.eventBus.push({
                parameterViewRemoved:   true,
                view:   this
            });
            Backbone.View.prototype.remove.call(this);
        },
        render: function() {
//            this.toggle(this.model.isActive());            
            if (this.startsNewLine()) this.$el.addClass("ep-starts-line");
        },
        /**
         * Returns true if this view should start new line on the form.
         * @returns {Boolean}
         */
        startsNewLine:  function() {
            if (this.isPrimary()) {
                var parent = this.parent, siblings = parent && parent.children;
                var viewIdx = siblings && _.indexOf(siblings, this);
                var prevView = viewIdx > 0 &&  siblings && siblings[viewIdx-1];
                return prevView && prevView.model.isComplex();
            }
            return false;
        },
        getType:    function() {
            return this.type;
        },
        /**
         * Get the size provided by the model and return version useful
         * for the view.
         * @param {String} modelSize
         * @returns {String}
         */
        getSizeClass:   function(modelSize) {
            var s = modelSize || this.model.get("size");
            if (s === "x-small") return "input-mini";
            return "input-"+s.replace("-", "");
        },
        /**
         * A faded out parameter has decreased opacity.
         * @returns {undefined}
         */
        fadeIn: function() {
            this.$el.removeClass("inactive");
        },
        fadeOut:    function() {
            this.$el.addClass("inactive");
        },
        isFadedOut: function() {
            return this.$el.hasClass("inactive");
        },
        /**
         * 
         * @returns {undefined}
         */
        focus:  function() {
            throw new Error("ParameterView.focus() should be implemented in subtypes.");
        },
        isFocused:  function() {
            throw new Error("ParameterView.isFocused() should be implemented in subtypes.");
        },
        isPrimary:  function() {
            return this.getType() === ParameterView.TYPE_PRIMARY;
        },
        toggle: function(show) {
            this.$el[show ? "removeClass" : "addClass"]("hide");
        },
        isHidden:   function() {
            return this.$el.hasClass("hide");
        },
        renderLabel:    function() {
            var arrayChild = this.options.arrayChild;
            if (arrayChild && arrayChild.labelIsNumber) {
                return arrayChild.idx+1+".";
            }
            else {
                return this.model.get("label")+":";
            }
        },
        renderDescription:  function() {
            var arrayChild = this.options.arrayChild;
            if (! arrayChild || (arrayChild && arrayChild.idx === 0)) {
                return this.model.get("description");
            }
            else {
                return "&nbsp;";
            }
        },
        /**
         * By default primary parameter views are added "input-xlarge" class.
         * Then after rendering a test is made to see if description size
         * doesn't exceed available space. If it does then the class is removed
         * and "auto" width rules.
         * @returns {String}
         */
        getDescSize:    function() {
            return "";
        },
        /**
         * Needs to be called AFTER parameter is rendered.
         * Description block has width set to "auto" if it is higher than
         * the container.
         * @returns {undefined}
         */
        fixDescSize:    function() {
            if (this.isPrimary()) {
                var $help = this.$(".help-block");
                if ($help.children("span").height() > $help.height()) {
                    $help.removeClass().addClass("help-block");
                }
            }
        }
    }, {
        /**
         * @constant
         * This has the same value as similar constant in PageFormView.
         * This type of Bool is created when analysis page is first displayed
         * or after cache for page has been cleared
         */
        TYPE_PRIMARY:       10,
        TYPE_SECONDARY:     11
    });
    return ParameterView;
});
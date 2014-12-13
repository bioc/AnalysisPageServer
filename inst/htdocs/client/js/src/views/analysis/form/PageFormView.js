/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "views/parameters/ParameterViewFactory", "bootstrap"], 
    function(Backbone, Bacon, ParameterViewFactory) {
        
        function mapV(item) {
                return item.model.get("name")+" - "+item.model.cid;
            }
            function mapM(item) {
                return item.get("name")+" - "+item.cid;
            }
        
    var PageFormView = Backbone.View.extend({
        $submitBtn:     null,
        $cancelBtn:     null,
        $progressBar:   null,
        children:       null,
        /**
         * Flat array of all children and its children. Sorted as a ParameterCollection
         * it renders.
         * @type Array
         */
        descendants:    null,
        events: {
            "submit form":  "onSubmit",
            "click .form-actions button.ep-form-cancel":  "onClickCancel",
            "click .form-actions button.ep-form-advanced-toggle":  "onClickToggleAdvanced"
        },
        initialize: function(opts) {
            this.eventBus = opts.eventBus;
            this.appModel = opts.appModel;
            this.appView = opts.appView;
            this.children = [];
            this.descendants = [];
//            this.listenTo(this.model.parameters, "ready", this.onParametersReady);
            this.listenTo(this.appModel, "change:mode", this.onAppModelChangeMode);
            this.initializeEventBus();
            this.initializeIsRendered();
        },
        initializeEventBus: function() {
            var beforeRemoveES = this.asEventStream("before:remove");
            this.eventBus
                .filter(".parameterViewCreated")
                .takeUntil(beforeRemoveES)
                .onValue(this, "addDescendant");
            this.eventBus
                .filter(".parameterViewRemoved")
                .takeUntil(beforeRemoveES)
                .onValue(this, "removeDescendant");
        },
        _update: function(isRenderedIsReadyPair) {
            if (isRenderedIsReadyPair[1]) {
                this.toggleSubmitButton("enabled");
                this.toggleSubmitButton("callToAction");
//                this.model.parameters.size() === 1 && 
//                    this.model.parameters.at(0).get("type") === "combobox" &&
//                    this.$("form").submit();
            }
            else {
//                this.fadeOutDescendants();
                this.updateFading();
            }
        },
        updateFading: function() {
            // empty
        },
        initializeIsRendered: function() {
            this.isRenderedProperty = this.asEventStream("rendered").map(true)
                    .toProperty(false);
            Bacon.combineAsArray(
                    this.isRendered().filter(_.isEqual, true),
                    this.model.parameters.isReady()
                    )
                    .take(1)
                    .onValue(this, "_update");
        },
        isRendered: function() {
            return this.isRenderedProperty;
        },
        addDescendant:  function(msg) {
            this.descendants.splice(msg.at, 0, msg.view);
        },
        removeDescendant:   function(msg) {
            var idx = _.indexOf(this.descendants, msg.view);
            idx > -1 && this.descendants.splice(idx, 1);
        },
        /**
         * Page ParameterCollection should be already fetched when 
         * calling this method.
         * @returns {undefined}
         */
        render: function() {
            var view = this, v = null;
            
            var $formActions = view.$(".form-actions");
            view.$submitBtn = $formActions.children("button[type=submit]");
            view.$cancelBtn = $formActions.children("button.ep-form-cancel");
            view.$progressBar = $formActions.children(".form-actions > .progress");
            view.$advancedToggle = $formActions.children(".ep-form-advanced-toggle");
            
            var parameters = this.model.parameters;// already fetched
            var idx = 1;
            
            this.renderAdvancedToggle();
            
            _.each(parameters.getRoots(), function(parameter) {
                v = ParameterViewFactory.create(parameter, {
                    parent:     view,
                    type:       view.getType(),
                    tabindex:   idx++,
                    eventBus:   this.eventBus,
                    appView:    this.appView
                });
                view.children.push(v);
                v.render();
                $formActions.before(v.$el);
            }, this);
            
            this.trigger("rendered");
            
        },
        getAdvancedToggleTitle: function() {
            return (this.appModel.isModeSimple() && "Show Advanced Options") || "Hide Advanced Options";
        },
        getAdvancedToggleContent: function() {
            var paramList = this.model.parameters.getAdvanced();
            paramList = _.map(paramList, function(param) {
                return param.get("label");
            });
            return ((this.appModel.isModeSimple() && "Click to show: ") || "Click to hide: ")+paramList.join(", ");
        },        
        renderAdvancedToggle:   function() {
            this.$advancedToggle.popover("destroy");
            this.model.parameters.hasAdvanced() && this.$advancedToggle.removeClass("hide");
            this.appModel.isModeAdvanced() && this.$advancedToggle.addClass("active");
            this.$advancedToggle.popover({
                placement:  "top",
                trigger:    "hover",
                title:      this.getAdvancedToggleTitle(),
                content:    this.getAdvancedToggleContent(),
                container:  "body"
            });
        },
        getType:    function() {
            throw new Error("PageFormView.getType() should be implemented in subtypes.");
        },
        remove: function() {
            this.descendants = null;
            _.each(this.children, function(child) {
                child.remove();
            });
            this.trigger("before:remove");
            Backbone.View.prototype.remove.call(this);
        },
        fetchAnalysis:    function() {
            function enableSubmitButton(view) {
                view.toggleSubmitButton("normal");
                view.toggleSubmitButton("enabled");
            }
            function onError(view) {
                enableSubmitButton(view);
                view.$cancelBtn.prop("disabled", true);
            }
            function onSuccess(view) {
                enableSubmitButton(view);
                view.$cancelBtn.prop("disabled", true);
                navigateToPageView(view);
            }
            function navigateToPageView(view) {
                view.eventBus.push({
                    router:             true,
                    navigateToPageView: true,
                    refreshSecondary:   true,
                    pageModel:          view.model,
                    trigger:            true
                });
            }
            var analysisES = this.model.fetchAnalysis();
//            analysisES.log("PageFormView analysisES");
            analysisES
                    // typical fields present in analysis response
                    .filter(".type")
                    .filter(".name")
                    .filter(".value")
                    .onValue(onSuccess, this);
            // test for presence of jqXHR object which is put as a result of error
            analysisES
                    .filter(".readyState")
                    .filter(".status")
                    .onValue(onError, this);
        },
        
        toggleSubmitButton: function(state) {
            var $bar;
            this.$submitBtn.removeClass("animated pulse");
            switch (state) {
                case "enabled":
                    this.$submitBtn.prop("disabled", false);
                    break;
                case "disabled":
                    this.$submitBtn.prop("disabled", true);
                    break;
                case "callToAction":
                    this.$submitBtn.addClass("animated pulse");
                    break;
                case "progress":
                    this.$progressBar.width(this.$submitBtn.outerWidth());
                    this.$submitBtn.hide();
                    $bar = this.$progressBar.children();
                    var mean = this.model.localModel.get("analysisMeanLoadTime") || 200;
                    $bar.css("transitionDuration", "0ms");
                    $bar.width(0);
                    this.$progressBar.show();
                    $bar.css("transitionDuration", mean+"ms");
                    $bar.width("100%");
                    break;
                case "normal":
                    this.$submitBtn.show();
                    this.$progressBar.hide();
                    $bar = this.$progressBar.children();
                    $bar.css("transitionDuration", "0ms");
                    $bar.width(0);
                    break;
            }
            
        },
        /**
         * Utility function that allows me to find child's view among 
         * referenced children based on model.
         * @param {ParameterModel} parameterModel
         * @returns {undefined}
         */    
        getParameterView:   function(parameterModel) {
            return _.find(this.descendants, function(view) {
                return view.model === parameterModel;
            });
        },
        
        onSubmit:   function(e) {
            this.toggleSubmitButton("progress");
            this.$cancelBtn.prop("disabled", false);
            this.fetchAnalysis();
            e.preventDefault();
        },
                
        onClickCancel:  function(e) {
            e.preventDefault();
            this.$cancelBtn.prop("disabled", true);
            this.toggleSubmitButton("enabled");
            this.toggleSubmitButton("normal");
            this.model.abortFetchAnalysis();
        },
                
        onClickToggleAdvanced:  function(e) {
            e.preventDefault();
            if (this.appModel.isModeSimple())
                this.appModel.setMode("advanced");
            else
                this.appModel.setMode("simple");
        },
                
        onParametersReady:  function() {
            this.toggleSubmitButton("enabled");
            this.toggleSubmitButton("callToAction");
            this.model.parameters.size() === 1 && 
                    this.model.parameters.at(0).get("type") === "combobox" &&
                    this.$("form").submit();
        },
                
        onAppModelChangeMode:   function() {
            this.renderAdvancedToggle();
            this.$advancedToggle[this.appModel.isModeSimple() ? "removeClass" : "addClass"]("active");
        }
    }, {
        /**
         * Primary Analysis Page Form is shown either
         * on the very first visit on the page
         * or after changing value of persistent parameter on any other page.
         * It's displayed alone.
         * @constant
         */
        TYPE_PRIMARY:   10,
        /**
         * Secondary Form is smaller than Primary. It's compressed to fit 
         * into sidebar of Analysis Page
         * @constant
         */
        TYPE_SECONDARY: 11
    });
    return PageFormView;
});
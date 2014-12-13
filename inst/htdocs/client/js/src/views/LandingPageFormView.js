/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon",
    "views/parameters/combobox/ComboboxParameterView", "TemplateManager",
    "views/parameters/ParameterViewFactory",
    "bacon.jquery", "backbone.eventstreams"
], function(Backbone, Bacon,
    ComboboxParameterView, TemplateManager, ParameterViewFactory) {
    
    var LandingPageFormView = Backbone.View.extend({
        /**
         * Cached Submit button
         * @type jQuery
         */
        $button:        null,
        /**
         * @type ParameterModel
         */
        mainParameter:  null,

        initialize: function(opts) {
            this.appView = opts.appView;
            this.mainParameter = this.model.parameters.findWhere({ name: opts.mainParameter });
            this.listenTo(this.mainParameter, "change:searchTerm", this.onChangeSearchTerm);
            this.listenTo(this.mainParameter, "dependencies:met", this.onDependenciesMet);
            this.listenTo(this.mainParameter, "change:suggestions", this.onChangeSuggestions);
            this.listenTo(this.mainParameter, "fetch:suggestions:fail", this.onFetchSuggestionsFail);
            this.pages = opts.pages;
            this.eventBus = opts.eventBus;
            this.initializeStateBus();
        },
        initializeEventStreams: function() {
            this.beforeRemoveES = this.asEventStream("before:remove");
            // Sometimes Chrome doesn't allow this.$el to catch submit event
            // of the form and whole page reloads with study param in query string
            // so catch it early on the very form
            this.$("form").submitE()
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onSubmit");
            // this should work only for forms with one parameter
            this.mainParameter.asEventStream("change:value", function(parameter, value, opts) {
                        return {
                            options: opts
                        };
                    })
                    .filter(".options.viewTriggered")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "onChangeValue");
        },
        render:     function() {
            var f = TemplateManager.render("ep-landing-search-form-tmpl");
            this.$el.html(f);
            this.mainParameterView = ParameterViewFactory.create(this.mainParameter, {
                type:       ComboboxParameterView.TYPE_LANDING,
//                tabindex:   this.options.tabindex,
                appView:    this.appView,
                eventBus:   this.eventBus
            });
            this.mainParameterView.render();
            this.$el.children().html(this.mainParameterView.$el);
            
            this.$button = this.$("button");
            this.$button.prop("disabled", ! this.mainParameter.hasValue());
            this.buttonAnimE = this.$button.asEventStream("animationend webkitAnimationEnd");
            this.initializeEventStreams();
        },
               
        onChangeValue:  function() {
            // Firefox won't fire animationend if element is disabled so 
            // turn element enabled first
            this.pushState(["enable", "callToAction", "disable", "wait"]);
            this.fetchAnalysis();
        },
               
        onDependenciesMet:  function() {
            this.pushState(["disable", "wait"]);
        },      
         
        onChangeSuggestions:    function() {
            this.pushState(["show", "enable"]);
        },
        
        onFetchSuggestionsFail: function() {
            this.pushState(["show", "enable"]);
        },
               
        onChangeSearchTerm: function(e) {
            this.pushState(["disable", "wait"]);
        },
               
        /**
         * Fired when "Submit" button is clicked
         * @param {Event} e
         * @returns {undefined}
         */
        onSubmit:   function(e) {
            e.preventDefault();
            if (this.mainParameter.hasValue()) {
                this.fetchAnalysis();
            }
        },
                
        fetchAnalysis:    function() {
            function navigateToAnalysisPage(view, analysis) {
                view.eventBus.push({
                    router:             true,
                    navigateToPageView: true,
                    secondary:          true,
                    pageModel:          view.model,
                    trigger:            true
                });
            }
            function onError(view) {
                view.pushState(["show", "enable"]);
            }
            // Firefox won't fire animationend if element is disabled so 
            // turn element enabled first
            this.pushState(["enable", "flip", "wait", "disable"]);
            
            this.mainParameterView.enableLoading();

            var analysisES = this.model.fetchAnalysis();
            analysisES
                    // typical fields present in analysis response
                    .filter(".type")
                    .filter(".name")
                    .filter(".value")
                    .doAction(this, "pushState", ["show", "enable"])
                    .doAction(this.mainParameterView, "disableLoading")
                    .onValue(navigateToAnalysisPage, this);
            // test for presence of jqXHR object which is put as a result of error
            analysisES
                    .filter(".readyState")
                    .filter(".status")
                    .onValue(onError, this);
        },
                
        initializeStateBus: function() {
            this.stateBus = new Bacon.Bus();
            this.stateBus
                    .flatMapConcat(this, "_enterState")
                    .onValue(function() {});
        },
                
        pushState:  function(states) {
            _.isArray(states) || (states = [states]);
            _.each(states, function(state) {
                this.stateBus.push(state);
            }, this);
        },
                
        _enterState:    function(state) {
            this.$button.removeClass("animated flipOutX pulse");
            switch (state) {
                case "disable":
                    this.$button.prop("disabled", true);
                    return Bacon.noMore;
                case "enable":
                    this.$button.prop("disabled", false);
                    return Bacon.noMore;
                case "flip":
                    this.$button.addClass("animated flipOutX");
                    return this.buttonAnimE.take(1);
                case "callToAction":
                    this.$button.addClass("animated pulse");
                    return this.buttonAnimE.take(1);
                case "show":
                    this.$button.children("i").removeClass("icon-time").addClass("icon-arrow-right");
                    return Bacon.noMore;
                case "wait":
                    this.$button.children("i").removeClass("icon-arrow-right").addClass("icon-time");
                    return Bacon.noMore;
            }
        },
        
        remove: function() {
            this.trigger("before:remove");
            this.stateBus.end();
            Backbone.View.prototype.remove.call(this);
        }
    });
    
    return LandingPageFormView;
    
});
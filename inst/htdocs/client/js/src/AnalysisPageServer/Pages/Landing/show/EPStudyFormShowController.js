/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon", "velocity.ui"], 
function(Marionette, Bacon) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("parameters:views:form:landing:initialize", this.initializeView, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        initializeView: function(formView) {
            var self = this;
            this.initializeStateBus(formView);
            var studyModel = this._getStudyModel(formView);
            this.listenTo(formView, "submit", this._onSubmit);
            formView.once("destroy", function() {
                self.stopListening(formView);
            });
            formView.listenTo(studyModel, "set:value", this._onModelSetValue);
            formView.listenTo(studyModel, "change:searchTerm", _.partial(this._onModelChangeSearchTerm, this));
            formView.listenTo(studyModel, "change:suggestions", _.partial(this._onModelChangeSuggestions, this));
            formView.listenTo(studyModel, "fetch:suggestions:fail", _.partial(this._onModelFetchSuggestionsFail, this));
        },
        initializeStateBus: function(formView) {
            formView.stateBus = new Bacon.Bus();
            formView.stateBus
                    .flatMapConcat(this, "_enterState", formView)
                    .onValue(function() {});
            formView.once("destroy", function() {
                formView.stateBus.end();
            });
        },
        pushState:  function(formView, states) {
            _.isArray(states) || (states = [states]);
            _.each(states, function(state) {
                formView.stateBus.push(state);
            }, this);
        },
        _getStudyModel: function(formView) {
            return formView.collection.findWhere({name: "study"});
        },
        _getStudyView: function(formView) {
            return formView.children.findByModel(this._getStudyModel(formView));
        },
        _enterState:    function(formView, state) {
            var studyView = this._getStudyView(formView);
            var submitBtn = studyView.ui.submitBtn;
            switch (state) {
                case "disable":
                    submitBtn.prop("disabled", true);
                    return Bacon.noMore;
                case "enable":
                    submitBtn.prop("disabled", false);
                    return Bacon.noMore;
                case "flip":
                    return Bacon.fromPromise($.Velocity.animate(submitBtn, "transition.flipOutX"));
                case "callToAction":
                    return Bacon.fromPromise($.Velocity.animate(submitBtn, "callout.pulse"));
                case "show":
                    submitBtn.children("i").removeClass("icon-time").addClass("icon-arrow-right");
                    return Bacon.noMore;
                case "wait":
                    submitBtn.children("i").removeClass("icon-arrow-right").addClass("icon-time");
                    return Bacon.noMore;
            }
        },
        _onSubmit: function(args) {
            // Firefox won't fire animationend if element is disabled so 
            // turn element enabled first
            this.pushState(args.view, ["enable", "callToAction", "disable", "wait"]);
        },
        _onModelSetValue: function(model, value, opts) {
            if (! opts.viewTriggered) return;
            // Firefox won't fire animationend if element is disabled so 
            // turn element enabled first
            this.trigger("submit", {
                view: this,
                model: this.model
            });
        },
        _onModelChangeSuggestions: function(ctrl) {
            ctrl.pushState(this, ["show", "enable"]);
        },
        
        _onModelFetchSuggestionsFail: function(ctrl) {
            ctrl.pushState(this, ["show", "enable"]);
        },
               
        _onModelChangeSearchTerm: function(ctrl) {
            ctrl.pushState(this, ["disable", "wait"]);
        }
    });
});
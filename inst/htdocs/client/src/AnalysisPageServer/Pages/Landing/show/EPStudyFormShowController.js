/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import Bacon from "bacon";
import "velocity/velocity.ui";

export default Marionette.Controller.extend({
    initialize: function() {
        app.channel.reply("parameters:views:form:landing:initialize", this.initializeView, this);
    },
    onDestroy: function() {
        app.channel.stopReplying("parameters:views:form:landing:initialize");
    },
    initializeView: function(formView) {
        this.initializeStateBus(formView);
        var studyModel = this._getStudyModel(formView);
        this.listenTo(formView, "submit", this._onSubmit);
        formView.once("destroy", () => this.stopListening(formView));
        formView.listenTo(studyModel, "set:value", this._onModelSetValue);
        formView.listenTo(studyModel, "change:searchTerm", () => this._onModelChangeSearchTerm(formView));
        formView.listenTo(studyModel, "change:suggestions", () => this._onModelChangeSuggestions(formView));
        formView.listenTo(studyModel, "fetch:suggestions:fail", () => this._onModelFetchSuggestionsFail(formView));
    },
    initializeStateBus: function(formView) {
        formView.stateBus = new Bacon.Bus();
        formView.stateBus
                .flatMapConcat(this, "_enterState", formView)
                .onValue(function() {});
        formView.once("destroy", () => formView.stateBus.end());
    },
    pushState:  function(formView, states) {
        _.isArray(states) || (states = [states]);
        _.each(states, state => formView.stateBus.push(state));
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
    _onModelChangeSuggestions: function(fv) {
        this.pushState(fv, ["show", "enable"]);
    },

    _onModelFetchSuggestionsFail: function(fv) {
        this.pushState(fv, ["show", "enable"]);
    },

    _onModelChangeSearchTerm: function(fv) {
        this.pushState(fv, ["disable", "wait"]);
    }
});

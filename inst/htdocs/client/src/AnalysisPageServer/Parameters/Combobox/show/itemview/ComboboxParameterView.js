/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 */
import _ from "underscore";
import Marionette from "marionette";
import Bacon from "bacon";
import app from "app";
import config from "config";
import Select2Behavior from "../Select2ComboboxBehavior";
import BaseBehavior from "../../../show/behaviors/ParameterBehavior";
import landingJst from "./landingTemplate.html!jst";
import textJst from "AnalysisPageServer/Parameters/show/itemview/textTemplate.html!jst";
import loadIndJst from "Common/templates/loadIndicator.html!jst";

export default Marionette.LayoutView.extend({

    getTemplate() {
        if (this.getOption("type") === "landing") {
            return landingJst;
        }
        else {
            return textJst;
        }
    },
    className: "control-group",

    ui: {
        field: "input[type=text]",
        submitBtn: "button[type=submit]"
    },

    regions: {
        loader: "[data-loader-region]"
    },

    modelEvents: {
        "fetch:suggestions:start": "onModelFetchSuggestionsStart",
        "fetch:suggestions:success": "onModelFetchSuggestions",
        "fetch:suggestions:fail": "onModelFetchSuggestionsFail"
    },

    behaviors: {
        Select2: {
            behaviorClass: Select2Behavior,
            optionsAttribute: "suggestions"
        },
        Base: {
            behaviorClass: BaseBehavior
        }
    },

    initialize() {

    },

    templateHelpers() {
        return app.channel.request("parameters:views:template-helpers", this);
    },

    _setModelValue(e) {
        this.model.updateFromView(_.pick(e, ["added", "removed", "val"]), {viewTriggered: true});
    },

    onRender() {
//            this.updateSelectionFromModel();
        this._renderLoader();
    },

    _renderLoader() {
        var v = new Marionette.ItemView({
            template: loadIndJst
        });
        v.$el.css(this._getLoaderPosition());
        v.$el.css("position", "absolute");
        this.getRegion("loader").show(v);
    },

    focus() {
//            this.$("#"+this.cid).select2("open");
    },

    _getLoaderPosition() {
        return {
            top:  this.getOption("type") === "landing" ? "12px" : "3px",
            left: "6px"
        };
    },

    enableLoading() {
        this.$el.addClass("ep-loading");
    },

    disableLoading() {
        this.$el.removeClass("ep-loading");
    },

    onModelFetchSuggestionsStart() {
        this.enableLoading();
    },
    onModelFetchSuggestions() {
        this.disableLoading();
    },
    onModelFetchSuggestionsFail(url, jqXHR) {
        this.disableLoading();
        app.channel.request("app:view:show-modal", {
            type: "error",
            fullErrorText: jqXHR.responseText,
            backdrop: false,
            withClose: true,
            title: "Error while populating '"+this.model.get("label")+"' options.",
            doBtnLabel: "Send an email about this?",
            cancelBtnLabel: "Cancel",
            permalink: window.location.origin+url
        });
    },
    onShowFully() {

    }
});

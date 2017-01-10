/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import TextParameterView from "./itemview/TextParameterView";
import BoolParameterView from "./itemview/BoolParameterView";
import ArrayParameterView from "./compositeview/ArrayParameterView";
import CompoundParameterView from "./compositeview/CompoundParameterView";
import SliderParameterView from "./itemview/SliderParameterView";
import FileParameterView from "./itemview/FileParameterView";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("parameters:views:class", this.getClassForModel, this);
        app.channel.reply("parameters:views:options", this.getViewOptions, this);
        app.channel.reply("parameters:views:template-helpers", this.getTemplateHelpers, this);
    },
    onDestroy() {
        app.channel.stopReplying("parameters:views:class");
        app.channel.stopReplying("parameters:views:options");
        app.channel.stopReplying("parameters:views:template-helpers");
    },
    getClassForModel(parameterModel) {
        switch (parameterModel.get("type")) {
            case "text":
                return TextParameterView;
            case "bool":
                return BoolParameterView;
            case "slider":
                return SliderParameterView;
            case "array":
                return ArrayParameterView;
            case "compound":
                return CompoundParameterView;
            case "file":
                return FileParameterView;
            case "combobox":
                return app.channel.request("parameters:views:combobox:class", parameterModel);
            case "select":
                return app.channel.request("parameters:views:select:class", parameterModel);
        }
    },
    getViewOptions(parameterModel, parentView) {
        return {
            model: parameterModel,
            collection: parameterModel.isComplex() ? parameterModel.children : null,
            type: parentView.getOption("type"),
            parent: parentView
        };
    },
    getTemplateHelpers(parameterView) {
        return {
            _,
            baseId: parameterView.cid,
            size: this.getSizeClass(parameterView),
            primary: parameterView.getOption("type") === "primary",
            label: this.getLabel(parameterView),
            desc: this.getDescription(parameterView),
            // @see EXPRESSIONPLOT-492
            value: _.isUndefined(parameterView.model.getValue()) ? "" : parameterView.model.getValue(),
            prompt: this.getPrompt(parameterView)
        };
    },
    getLabel(parameterView) {
        var arrayChild = parameterView.getOption("arrayChild");
        if (arrayChild && arrayChild.labelIsNumber) {
            return arrayChild.idx+1+".";
        }
        else {
            return parameterView.model.get("label")+":";
        }
    },
    getDescription(parameterView) {
        var arrayChild = parameterView.getOption("arrayChild");
        if (! arrayChild || (arrayChild && arrayChild.idx === 0)) {
            return parameterView.model.get("description") || "&nbsp;";
        }
        else {
            return "&nbsp;";
        }
    },
    getSizeClass(parameterView, modelSize) {
        var s = modelSize || parameterView.model.get("size");
        if (s === "x-small") return "input-mini";
        return "input-"+s.replace("-", "");
    },
    getPrompt(parameterView) {
        return parameterView.model.get("prompt") || "";
    }
});

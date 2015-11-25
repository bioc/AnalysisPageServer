/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./itemview/TextParameterView", "./itemview/BoolParameterView",
    "./compositeview/ArrayParameterView", "./compositeview/CompoundParameterView",
    "./itemview/SliderParameterView", "./itemview/FileParameterView"], 
function(Marionette, TextParameterView, BoolParameterView, 
ArrayParameterView, CompoundParameterView, SliderParameterView, FileParameterView) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getReqRes().setHandler("parameters:views:class", this.getClassForModel, this);
            this.getReqRes().setHandler("parameters:views:options", this.getViewOptions, this);
            this.getReqRes().setHandler("parameters:views:template-helpers", this.getTemplateHelpers, this);
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        getClassForModel: function(parameterModel) {
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
                    return this.getReqRes().request("parameters:views:combobox:class", parameterModel);
                case "select":
                    return this.getReqRes().request("parameters:views:select:class", parameterModel);
            }
        },
        getViewOptions: function(parameterModel, parentView) {
            return {
                model: parameterModel,
                collection: parameterModel.isComplex() ? parameterModel.children : null,
                type: parentView.getOption("type"),
                parent: parentView
            };
        },
        getTemplateHelpers: function(parameterView) {
            return {
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
        getLabel: function(parameterView) {
            var arrayChild = parameterView.getOption("arrayChild");
            if (arrayChild && arrayChild.labelIsNumber) {
                return arrayChild.idx+1+".";
            }
            else {
                return parameterView.model.get("label")+":";
            }
        },
        getDescription: function(parameterView) {
            var arrayChild = parameterView.getOption("arrayChild");
            if (! arrayChild || (arrayChild && arrayChild.idx === 0)) {
                return parameterView.model.get("description") || "&nbsp;";
            }
            else {
                return "&nbsp;";
            }
        },
        getSizeClass: function(parameterView, modelSize) {
            var s = modelSize || parameterView.model.get("size");
            if (s === "x-small") return "input-mini";
            return "input-"+s.replace("-", "");
        },
        getPrompt: function(parameterView) {
            return parameterView.model.get("prompt") || "";
        }
    });
});
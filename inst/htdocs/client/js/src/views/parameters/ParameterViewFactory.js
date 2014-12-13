/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define([
    "views/parameters/combobox/createComboboxParameterView",
    "views/parameters/select/createSelectParameterView",
    "views/parameters/BoolParameterView",
    "views/parameters/TextParameterView",
    "views/parameters/ArrayParameterView",
    "views/parameters/CompoundParameterView",
    "views/parameters/SliderParameterView",
], function(
    createComboboxParameterView, createSelectParameterView,
    BoolParameterView, TextParameterView, ArrayParameterView,
    CompoundParameterView, SliderParameterView) {
    var ParameterViewFactory = {
        create:    function(parameter, options) {
            var v = null, c = [];
            options.model = parameter;
            switch (parameter.get("type")) {
                case "combobox":
                    c.push("control-group");
                    options.className = c.join(" ");
                    v = createComboboxParameterView(options);
                    break;
                case "bool":
                    c.push("control-group");
                    options.className = c.join(" ");
                    v = new BoolParameterView(options);
                    break;
                case "array":
                    c.push("control-group", "control-array-group", "light-blue");
                    options.className = c.join(" ");
                    options.factory = ParameterViewFactory;
                    v = new ArrayParameterView(options);
                    break;
                case "compound":
                    c.push("control-group", "control-array-group", "light-blue");
                    options.className = c.join(" ");
                    options.factory = ParameterViewFactory;
                    v = new CompoundParameterView(options);
                    break;
                case "text":
                    c.push("control-group");
                    options.className = c.join(" ");
                    v = new TextParameterView(options);
                    break;
                case "select":
                    c.push("control-group");
                    options.className = c.join(" ");
                    v = createSelectParameterView(options);
                    break;
                case "slider":
                    c.push("control-group");
                    options.className = c.join(" ");
                    v = new SliderParameterView(options);
                    break;
            }
            return v;
        }
    };
    return ParameterViewFactory;
});
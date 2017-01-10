/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 *
 * This factory defines a method which allows programmer to dynamically
 * set prototype chain for newly created Combobox Parameter View.
 * The routine for setting the chain is based on self-dependency of the model
 * and the place where the view will appear.
 */
import DropdownSelectParameterView from "./DropdownSelectParameterView";
import RadioSelectParameterView from "./RadioSelectParameterView";

export default function(options) {
        
    var style = options.model.get("style");
    if (style == "radio") {
        return RadioSelectParameterView;
    }
    else {
        return DropdownSelectParameterView;
    }
}

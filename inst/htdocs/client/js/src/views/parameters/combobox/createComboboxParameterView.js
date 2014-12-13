/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * This factory defines a method which allows programmer to dynamically
 * set prototype chain for newly created Combobox Parameter View.
 * The routine for setting the chain is based on self-dependency of the model
 * and the place where the view will appear.
 */
define([
        "views/parameters/combobox/ComboboxParameterView",
        "views/parameters/combobox/primaryMixin",
        "views/parameters/combobox/secondaryMixin",
        "views/parameters/combobox/landingMixin",
        "views/parameters/combobox/nonSelfDependentMixin",
        "views/parameters/combobox/selfDependentMixin",
    ], function(
    ComboboxParameterView, 
    primaryMixin,
    secondaryMixin,
    landingMixin,
    nonSelfDependentMixin, selfDependentMixin) {
    return function(options) {
            var Parent = null;
            Parent = ComboboxParameterView;
            
            if (options.model.get("selfDependent")) {
                Parent = Parent.extend.apply(Parent, selfDependentMixin(Parent));
            }
            else {
                Parent = Parent.extend.apply(Parent, nonSelfDependentMixin(Parent));
            }

            var Constructor = null;
            /*
             * Following "subtypes" are extended with proto- and static properties in
             * the form of arrays provided by suitable modules
             */
            switch (options.type) {
                case ComboboxParameterView.TYPE_PRIMARY:
                    Constructor = Parent.extend.apply(Parent, primaryMixin(Parent));
                    break;
                case ComboboxParameterView.TYPE_SECONDARY:
                    Constructor = Parent.extend.apply(Parent, secondaryMixin(Parent));
                    break;
                case ComboboxParameterView.TYPE_LANDING:
                    Constructor = Parent.extend.apply(Parent, landingMixin(Parent));
                    break;
            }
            if (Constructor)
                return new Constructor(options);
            else
                throw new Error("ComboboxParameterViewFactory.create() - Constructor is undefined.");
        }
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["models/parameters/combobox/ComboboxParameterModel",
    "models/parameters/combobox/selfDependentMixin",
    "models/parameters/combobox/nonSelfDependentMixin",
    "models/parameters/combobox/multipleMixin",
    "models/parameters/combobox/nonMultipleMixin"], 
function(ComboboxParameterModel, selfDependentMixin, nonSelfDependentMixin,
        multipleMixin, nonMultipleMixin) {
    
    return function(attrs, opts) {
        var Model = ComboboxParameterModel;
        
        if (_.indexOf(_.values(attrs.dependent), attrs.name) > -1) {
            Model = Model.extend.apply(Model, selfDependentMixin(Model));
        }
        else {
            Model = Model.extend.apply(Model, nonSelfDependentMixin(Model));
        }
        
        if (attrs.allow_multiple) {
            Model = Model.extend.apply(Model, multipleMixin(Model));
        }
        else {
            Model = Model.extend.apply(Model, nonMultipleMixin(Model));
        }
        
        return new Model(attrs, opts);
    }
});
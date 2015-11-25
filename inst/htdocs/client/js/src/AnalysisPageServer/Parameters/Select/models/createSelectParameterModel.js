define(["./SelectParameterModel", "./multipleMixin", "./nonMultipleMixin"],
function(SelectParameterModel, multipleMixin, nonMultipleMixin) {
    
    return function(attrs, opts) {
        var Model = SelectParameterModel;
        
        if (attrs.allow_multiple) {
            Model = Model.extend.apply(Model, multipleMixin(Model));
        }
        else {
            Model = Model.extend.apply(Model, nonMultipleMixin(Model));
        }
        
        return new Model(attrs, opts);
    };
    
});
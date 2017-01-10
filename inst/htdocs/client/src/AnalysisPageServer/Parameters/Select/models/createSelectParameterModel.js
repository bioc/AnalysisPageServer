import SelectParameterModel from "./SelectParameterModel";
import multipleMixin from "./multipleMixin";
import nonMultipleMixin from "./nonMultipleMixin";

export default function(attrs, opts) {
    var Model = SelectParameterModel;

    if (attrs.allow_multiple) {
        Model = Model.extend.apply(Model, multipleMixin(Model));
    }
    else {
        Model = Model.extend.apply(Model, nonMultipleMixin(Model));
    }

    return new Model(attrs, opts);
};

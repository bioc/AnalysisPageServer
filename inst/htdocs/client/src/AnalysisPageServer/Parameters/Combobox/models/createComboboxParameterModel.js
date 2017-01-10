/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import ComboboxParameterModel from "./ComboboxParameterModel";
import selfDependentMixin from "./selfDependentMixin";
import nonSelfDependentMixin from "./nonSelfDependentMixin";
import multipleMixin from "./multipleMixin";
import nonMultipleMixin from "./nonMultipleMixin";

export default function(attrs, opts) {
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

/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";

export default function(ParentModel) {
    return [{
            initialize(attrs, opts) {
                ParentModel.prototype.initialize.call(this, attrs, opts);
                this.set("selfDependent", false);
                this.set("externallyDependent", _.size(attrs.dependent) > 0);
            },

            onChangeSuggestions(model, suggestions, opts) {
                // either when it is "select" combobox or only one suggestion was fetched
                // and there is no current value of model somewhere in suggestions
                // model is allowed to set value to first suggestion
                var s;
                if (_.size(this.get("suggestions")) > 0 && ! this.hasValueInSuggestions()
                        && ! this.get("allow_multiple")) {
                    s = this.get("suggestions")[0];
                    this.set("readable", s.long_name, {viewTriggered: true});
                    this.setValue(s.id, {viewTriggered: true});
                }
            },
            onFetchSuggestionsFail() {
                this.setValue("", {viewTriggered: true});
            }
    }, {}];

};

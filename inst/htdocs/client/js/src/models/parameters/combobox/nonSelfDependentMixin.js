/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define([], function() {
    return function(ParentModel) {
        return [{
                initialize: function(attrs, opts) {
                    ParentModel.prototype.initialize.call(this, attrs, opts);
                    this.set("selfDependent", false);
                    this.set("externallyDependent", _.size(attrs.dependent) > 1);
                },
                onDependencyValueChanged:  function(dep, value, opts) {
                    // nullify value as it is now "outdated"
                    this.reset();
                    opts.viewTriggered && this.getSuggestions();
                },
                getSuggestions: function() {
                    if (this.areDependenciesMet(false)) {
                        ParentModel.prototype.getSuggestions.call(this);
                    }
                },
                onChangeSuggestions:    function(model, suggestions, opts) {
                    // either when it is "select" combobox or only one suggestion was fetched 
                    // and there is no current value of model somewhere in suggestions
                    // model is allowed to set value to first suggestion
                    var s;
                    if (_.size(this.get("suggestions")) > 0 && ! this.hasValueInSuggestions() 
                            && ! this.get("allow_multiple")) {
                        s = this.get("suggestions")[0];
                        this.set("readable", s.long_name, {viewTriggered: true});
                        this.set("value", s.id, {viewTriggered: true});
                    }
                }
        }, {}];
        
    };
});
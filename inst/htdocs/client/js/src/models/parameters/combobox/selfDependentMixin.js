/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define([], function() {
    return function(ParentModel) {
        return [{
                initialize: function(attrs, opts) {
                    ParentModel.prototype.initialize.call(this, attrs, opts);
                    this.set("selfDependent", true);
                    this.set("externallyDependent", _.size(attrs.dependent) > 1);
                    this.on("change:searchTerm", this.onSearchTermChanged);
                },

                setSearchTerm:  function(st, opts) {
                    st && st.length > 1 && this.set("searchTerm", st, opts);
                },

                isSearchTermAvailable:  function() {
                    return this.get("searchTerm");
                },

                onSearchTermChanged: function(model, searchTerm, opts) {
                    opts.viewTriggered && this.getSuggestions();
                },
                onDependencyValueChanged:  function() {
                    // nullify value as it is now "outdated"
                    this.reset();
                    this.getSuggestions();
                },
                getSuggestions: function() {
                    if (this.areDependenciesMet(false) && this.isSearchTermAvailable()) {
                        ParentModel.prototype.getSuggestions.call(this);
                    }
                },
                onChangeSuggestions:    function() {
                    // either when it is "select" combobox or only one suggestion was fetched 
                    // and there is no current value of model somewhere in suggestions
                    // model is allowed to set value to first suggestion
                    if (_.size(this.get("suggestions")) === 1
                            && ! this.hasValueInSuggestions()) {

        //                this.selectItem(0);
                            }
                }
        }, {}];
        
    };
    
});
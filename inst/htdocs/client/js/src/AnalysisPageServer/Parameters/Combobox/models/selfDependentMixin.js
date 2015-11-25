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

                onChangeSuggestions: function() {
                    
                },
                onFetchSuggestionsFail: function() {
                    
                }
        }, {}];
        
    };
    
});
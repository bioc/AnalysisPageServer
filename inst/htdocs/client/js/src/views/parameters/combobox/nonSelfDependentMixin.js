define(["TemplateManager", "bacon", "config", "bacon.jquery", "select2"], 
function(TemplateManager, Bacon, config) {
    return function(ParentView) {
        return [/*proto properties*/
            {
                getTemplateName:    function() {
                    return "ep-form-text-tmpl";
                },
                
                
                _mapQuery: function(q) {
                    function filterSuggestions(suggestions) {
                        return _.filter(suggestions, function(s) {
                            return s.long_name 
                                    && s.long_name.toString().toLowerCase().indexOf(q.term.toLowerCase()) > -1;
                        });
                    }
                    // I need query.callback in the last step so pass it here
                    return {
                        query: q,
                        suggestions: filterSuggestions(this.model.get("suggestions"))
                    };
                },
                
                
                reset: function() {
                    $("#"+this.cid).select2("val", "");
                }
                
            }
        ];
    }
});
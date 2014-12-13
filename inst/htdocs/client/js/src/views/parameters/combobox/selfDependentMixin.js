define(["TemplateManager", "bacon", "bacon.jquery", "select2"], function(TemplateManager, Bacon) {
    return function(ParentView) {
        return [/*proto properties*/
            {
                getTemplateName:    function() {
                    return "ep-form-text-tmpl";
                },

                _mapQuery: function(q) {
                    var same = q.term == this.model.get("searchTerm");
                    this.model.set("searchTerm", q.term, {viewTriggered: true});
                    // I need query.callback in the last step so pass it here
                    return same ? 
                                Bacon.once({
                                    query: q, 
                                    suggestions: this.model.get("suggestions")
                                }) : 
                                Bacon.combineWith(
                                    function(q, model) {
                                        return {
                                            query: q,
                                            suggestions: model.get("suggestions")
                                        };
                                    },
                                    Bacon.once(q), 
                                    this.model.asEventStream("fetch:suggestions:success").take(1)
                                )
                },
                
                _select2NextSearchTerm: function(data, currentSearchTerm) {
                    return currentSearchTerm || this.model.get("searchTerm");
                },
                
                getSelect2Options: function() {
                    return _.extend(ParentView.prototype.getSelect2Options.call(this), {
                        containerCssClass: "input-xlarge",
                        minimumInputLength: 2
                    });
                },
                
                reset: function() {
                    $("#"+this.cid).select2("val", "");
                }
            }
        ];
    }
});
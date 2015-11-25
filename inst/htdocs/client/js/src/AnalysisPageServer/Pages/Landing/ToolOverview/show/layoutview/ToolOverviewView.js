/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], function(Marionette) {
    return Marionette.LayoutView.extend({
        template: "#ep-tool-overview-tmpl",
        className: "row-fluid",
        
        regions: {
            list: ".span5",
            body: ".span7"
        },
        
        initialize:     function(opts) {
            
        },
                
        showToolDesc:   function($name) {
            var name = $name.attr("data-name");
            $name.parent().addClass("active");
            $name.parent().siblings().removeClass("active");
            this.$(".span7").children().hide()
                .filter('[data-name="'+name+'"]').show();
        },
                
        hideToolDescs:  function() {
            this.$(".span7").children().hide();
        },
                
        selectTool:        function(name) {
            var page = this.pages.findWhere({name: name});
            page.ensureParameters()
                    .take(1)
                    .onValue(this, "_selectTool");
        },
        _selectTool: function(page) {
            var props = {
                router:             true,
                navigateToPageView: true,
                pageModel:          page,
                trigger:            true
            };
            // omit going to primary form area for parameterless pages
            if (page.parameters.size()) {
                props.primary = true;
            }
            else {
                props.secondary = true;
            }
            this.eventBus.push(props);
        },
                
        onClickName:    function(e) {
            e.preventDefault();
            var $a = $(e.currentTarget);
            this.selectTool($a.attr("data-name"));
        },        
        
        onClickDesc:    function(e) {
            e.preventDefault();
            var $desc = $(e.currentTarget);
            this.selectTool($desc.attr("data-name"));
        },        
        
        onMouseenterName:   function(e) {
            this.showToolDesc($(e.currentTarget));
        },
                
        onMouseleave:   function(e) {
    
        }
    });
});
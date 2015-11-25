/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bootstrap"], 
    function(Marionette) {
    return Marionette.LayoutView.extend({
        template: "#ep-analysis-plot-tmpl",
        
        ui: {
            main: "[data-main]"
        },
        
        regions: {
            plot: "[data-plot-region]",
            menu: "[data-menu-region]",
            sidebar: "[data-sidebar-region]",
            table: "[data-table-region]"
        },
            
        onDestroy: function() {
            // some listeners outside this class may have been registered
            // with this namespace
            $(document).off("."+this.cid);
        },
        
        getDestroyES: function() {
            return this.asEventStream("before:destroy").take(1);
        }
    });
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["jquery"], function($) {
    return function($containers) {
        return _.map($containers, function(container) {
            return {
                tableVisible:   $(container).attr("data-set") && 
                            (! $(container).is("[data-table-visible]")
                            || $(container).attr("data-table-visible") == "yes"),
                sidebarVisible: ! $(container).is("[data-sidebar-visible]")   
                        || $(container).attr("data-sidebar-visible") == "yes",
                data_url:       $(container).attr("data-set"),
                plot_url:       $(container).attr("data-svg")
            };
        });
    };
});
/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import template from "./template.html!jst";
import "bootstrap";

export default Marionette.LayoutView.extend({
    template,

    ui: {
        main: "[data-main]"
    },

    regions: {
        plot: "[data-plot-region]",
        menu: "[data-menu-region]",
        sidebar: "[data-sidebar-region]",
        table: "[data-table-region]"
    },

    templateHelpers() {
        return _.pick(this.options, "sidebarVisible", "tableVisible");
    },

    onDestroy() {
        // some listeners outside this class may have been registered
        // with this namespace
        $(document).off("."+this.cid);
    }
});

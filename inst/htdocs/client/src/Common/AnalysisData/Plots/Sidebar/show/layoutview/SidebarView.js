/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import jst from "./sidebarTemplate.html!jst";
import "bootstrap";

export default Marionette.LayoutView.extend({
    template: jst,
    className: "accordion"
});

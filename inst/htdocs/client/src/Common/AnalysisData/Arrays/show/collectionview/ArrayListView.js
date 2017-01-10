/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import ItemView from "../layoutview/ArrayListItemView";

export default Marionette.CollectionView.extend({
    tagName: "dl",

    childView: ItemView,
    childViewOptions: function(dataModel, i) {
        return {
            pageModel: this.getOption("pageModel")
        };
    }
});

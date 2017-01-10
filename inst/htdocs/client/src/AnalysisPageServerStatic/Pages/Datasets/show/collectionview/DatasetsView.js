/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import Marionette from "marionette";
import DatasetView from "../layoutview/DatasetView";

export default Marionette.CollectionView.extend({

    childView: DatasetView

});

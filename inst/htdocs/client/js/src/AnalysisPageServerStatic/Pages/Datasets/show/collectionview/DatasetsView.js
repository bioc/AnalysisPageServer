/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "../layoutview/DatasetView"], 
function(Marionette, DatasetView) {
    return Marionette.CollectionView.extend({
        
        childView: DatasetView
        
    });
});
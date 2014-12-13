/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define([], function() {
    return function(datasets, opts) {
        datasets = _.map(datasets, function(dataset) {
            return _.extend(dataset, {
                in_menu:    true,
                name:       _.uniqueId("page-")
            });
        });

        opts.pages.set(datasets, {
            appModel:   opts.appView.model
        });
    };
});
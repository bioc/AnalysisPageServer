/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/analysis/array/ArrayListView", "views/analysis/array/ArrayTabsView"], function(ArrayListView, ArrayTabsView) {
    return function(definition, options) {
        options.definition = definition;// pass it to create children
        if (options.parent) {
            options.tagName = options.tagName || "dl";
            return new ArrayListView(options);
        }
        else {
            options.className = options.className || "tabbable";
            return new ArrayTabsView(options);
        }
    }
});
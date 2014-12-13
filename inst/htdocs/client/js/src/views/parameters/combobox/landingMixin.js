/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * This is NOT a Backbone View. The module returns an array with prototype and 
 * static properties, just like Backbone.View.extend() method accepts.
 */
define([], function() {
    return function(ParentView) {
        return [{
        getType:    function() {
            return ParentView.TYPE_LANDING;
        },
        getTemplateName:    function() {
            return "ep-form-landing-combobox-tmpl";
        },
        getTemplateOptions: function() {
            return _.extend(ParentView.prototype.getTemplateOptions.call(this), {
            });
        },
        _getLoaderPosition: function() {
            return {
                top:  "12px",
                left: "6px"
            };
        },
        getSelect2Options: function() {
            return _.extend(ParentView.prototype.getSelect2Options.call(this), {
                containerCssClass: "",
                minimumInputLength: 2
            });
        },
        initialize: function() {
            ParentView.prototype.initialize.apply(this, arguments);
        },
        render: function() {
            ParentView.prototype.render.call(this);
        },
        enableLoading:  function() {
            // empty
        }
    }];
    }
});
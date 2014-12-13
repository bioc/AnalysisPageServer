/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "config"], function(Backbone, config) {
    var FooterView = Backbone.View.extend({
        events: {
            "click #ep-footer-contact a":   "onClickContact"
        },
        initialize: function(opts) {
            this.render();
        },
        render: function() {
            this.$("#ep-footer-version").children().text("Version "+config["version"]);
        },
                
        onClickContact: function(e) {
            var gmailLinkTmpl = config["gmail.link.tmpl"];
            $(e.currentTarget).attr("href", 
                gmailLinkTmpl
                        .replace("ADDRESS", encodeURIComponent(config["contact.address"]))
                        .replace("TITLE", "ExpressionPlot Contact")
                        .replace("BODY", encodeURIComponent("Permalink to ExpressionPlot: \n\n"+window.location.href)));
        }
    });
    return FooterView;
});
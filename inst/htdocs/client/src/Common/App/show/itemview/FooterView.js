/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import "./ep-footer.less!";
import $ from "jquery";
import Marionette from "marionette";
import config from "config";

export default Marionette.ItemView.extend({
    template: false,
    el: "footer",

    ui: {
        contact: "[data-contact]",
        version: "[data-version]"
    },

    events: {
        "click @ui.contact": "_onClickContact"
    },

    onRender: function() {
        this.ui.version.text("Version "+config["version"]);
    },

    _onClickContact: function(e) {
        var gmailLinkTmpl = config["gmail.link.tmpl"];
        $(e.currentTarget).attr("href",
            gmailLinkTmpl
                    .replace("ADDRESS", encodeURIComponent(config["contact.address"]))
                    .replace("TITLE", "ExpressionPlot Contact")
                    .replace("BODY", encodeURIComponent("Permalink to ExpressionPlot: \n\n"+window.location.href)));
    }
});

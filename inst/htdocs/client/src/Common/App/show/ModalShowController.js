/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Backbone from "backbone";
import Marionette from "marionette";
import app from "app";
import ModalView from "./layoutview/ModalView";
import config from "config";
import alertJst from "Common/templates/alert.html!jst";
import "velocity/velocity.ui";

export default Marionette.Controller.extend({
    initialize: function() {

    },
    createView: function(opts) {
        var v;
        if (opts.type === "error") {
            v = this.createErrorView(opts);
        }
        else {
            v = this.createNormalView(opts);
        }
        v.once("hidden", function() {
            v.destroy();
        });
        return v;
    },
    createNormalView: function(opts) {
        var v = new ModalView(opts);
        v.once("render", function() {
            v.showChildView("body", opts.innerView);
        });
        return v;
    },
    _getErrorText: function(opts) {
        if (opts.fullErrorHtml) {
            return opts.fullErrorHtml;
        }
        else if (opts.fullErrorText) {
            let msg = _.isObject(opts.fullErrorText) && opts.fullErrorText.message;
            msg = msg || opts.fullErrorText;
            if (msg.length < 100) {
                return msg;
            }
            else {
                return `${msg.substring(0, 100)}
                <a class='more' href='#'><strong>[more...]</strong></a>
                <pre class='hide'>${msg}</pre>`;
            }
        }
        else {
            return "";
        }
    },
    createErrorView: function(opts) {
        var env = app.channel.request("app:model:env");
        if (opts.doBtnLabel && env !== "expressionplot") {
            opts.doBtnLabel = false;
        }
        var model = new Backbone.Model({
            type: "danger",
            title: false,
            withClose: false,
            text: this._getErrorText(opts)
        });
        var innerView = new Marionette.ItemView({
            template: alertJst,
            model: model
        });
        var v = new ModalView(opts);
        v.once("render", () => v.showChildView("body", innerView));
        v.on("do:primary:action", () => {
            v.ui.primaryBtn
                    .attr("target", "_blank")
                    .attr("href", this._prepareGmailErrorUrl(opts));
        });
        return v;
    },
    _prepareGmailErrorUrl: function(opts) {
        var gmailLinkTmpl = config["gmail.link.tmpl"];
        var body = `
Permalink:\n
${opts.permalink}\n\n\n
${opts.fullErrorHtml || opts.fullErrorText}\n\n\n\n
User Agent: ${window.navigator.userAgent}
        `;
        var title = opts.title;
        return gmailLinkTmpl
                .replace("ADDRESS", encodeURIComponent(config["contact.address"]))
                .replace("TITLE", encodeURIComponent(title))
                .replace("BODY", encodeURIComponent(body));
    }
});

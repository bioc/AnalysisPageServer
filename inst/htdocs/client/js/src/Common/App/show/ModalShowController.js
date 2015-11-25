/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "./layoutview/ModalView", "config", "globalChannel", "velocity.ui"], 
function(Marionette, ModalView, config, globalChannel) {
    return Marionette.Controller.extend({
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
                if (opts.fullErrorText.length < 100) {
                    return opts.fullErrorText;
                }
                else {
                    return opts.fullErrorText.substring(0, 100)+
                    " <a class='more' href='#'><strong>[more...]</strong></a>" +
                    "<pre class='hide'>"+opts.fullErrorText+"</pre>";
                }
            }
            else {
                return "";
            }
        },
        createErrorView: function(opts) {
            var env = globalChannel.reqres.request("app:model:env");
            if (opts.doBtnLabel && env !== "expressionplot") {
                opts.doBtnLabel = false;
            }
            var self = this;
            var model = new Backbone.Model({
                type: "danger",
                title: false,
                withClose: false,
                text: this._getErrorText(opts)
            });
            var innerView = new Marionette.ItemView({
                template: "#ep-alert-tmpl",
                model: model
            });
            var v = new ModalView(opts);
            v.once("render", function() {
                v.showChildView("body", innerView);
            });
            v.on("do:primary:action", function() {
                v.ui.primaryBtn
                        .attr("target", "_blank")
                        .attr("href", self._prepareGmailErrorUrl(opts));
            });
            return v;
        },
        _prepareGmailErrorUrl: function(opts) {
            var gmailLinkTmpl = config["gmail.link.tmpl"];
            var body =  "Permalink:\n"+opts.permalink+"\n\n\n"+
                        (opts.fullErrorHtml || opts.fullErrorText) + "\n\n\n\n" + 
                            "User Agent: " + window.navigator.userAgent;
            var title = opts.title;
            return gmailLinkTmpl
                    .replace("ADDRESS", encodeURIComponent(config["contact.address"]))
                    .replace("TITLE", encodeURIComponent(title))
                    .replace("BODY", encodeURIComponent(body));
        }
    });
});
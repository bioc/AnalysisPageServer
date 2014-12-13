/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/modals/ModalView", "TemplateManager", "config"], 
function(ModalView, TemplateManager, config) {
    var ErrorModalView = ModalView.extend({
        initialize: function(opts) {
            ModalView.prototype.initialize.call(this, opts);
            this.pageModel = opts.pageModel;
        },
        render: function() {
            ModalView.prototype.render.call(this);
            var eMsg = this.options.fullErrorText;
            this.setBody(TemplateManager.render("ep-alert-tmpl", {
                type:   "danger",
                text:   eMsg && (eMsg.substring(0, 50)+" <strong class='more'>[more...]</strong>" +
                        "<pre class='hide'>"+eMsg+"</pre>")
            }));
        },
        onClickBtnPrimary:  function(e) {
            ModalView.prototype.onClickBtnPrimary.apply(this, arguments);
            var gmailLinkTmpl = config["gmail.link.tmpl"];
            var body =  "<a href='"+window.location.href+"'>Permalink to the page</a>\n\n\n"+
                        this.options.fullErrorText + "\n\n\n\n" + 
                            "User Agent: " + window.navigator.userAgent;
            var title = (this.pageModel ? this.pageModel.get("label")+" " : "")+"Analysis Failed";
            this.$(".btn-primary")
                    .attr("target", "_blank")
                    .attr("href", 
                        gmailLinkTmpl
                        .replace("ADDRESS", encodeURIComponent(config["contact.address"]))
                        .replace("TITLE", encodeURIComponent(title))
                        .replace("BODY", encodeURIComponent(body)));
                    
        },
        onClickBtnCancel:   function(e) {
            e.preventDefault();
            this.hide();
        }
    });
    return ErrorModalView;
});
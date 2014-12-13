/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager", "bootstrap"], function(Backbone, TemplateManager) {
    
    var ModalView = Backbone.View.extend({
        events: {
            "shown":        "onShown",
            "hidden":       "onHidden",
            "click .more":  "onClickMore",
            "click .close": "onClickClose",
            "click .btn-primary":   "onClickBtnPrimary",
            "click .btn-cancel":    "onClickBtnCancel"
        },
        initialize: function(opts) {
            this.options = opts;
        },
        render: function() {
            this.$el.html(TemplateManager.render("ep-modal-tmpl", this.options));
            this.$el.modal(_.defaults(this.options, {
                backdrop:   "static",
                keyboard:   false
            }));
        },
        hide:   function() {
            this.$el.modal("hide");
        },
        setBody:    function(view) {
            this.$(".modal-body").html(view.$el ? view.$el : view);
        },
        runProgressBar: function() {
            var $progressBar = this.$(".progress");
            var $bar = $progressBar.children();
            var mean = parseInt(this.options.progressBar) || 1000;
            $bar.css("transitionDuration", mean+"ms");
            $bar.width("100%");
        },
        onShown: function() {
            if (this.options.progressBar) this.runProgressBar();
        },
        onHidden:   function() {
            this.remove();
            this.trigger("hidden");
        },
        onClickMore:    function(e) {
            this.$(".modal-body .hide").removeClass("hide");
        },
        onClickClose:   function() {
            this.hide();
        },
        onClickBtnPrimary:  function() {
            this.hide();
            this.trigger("do:primary:action");
        },
        onClickBtnCancel:  function() {
            this.hide();
            this.trigger("do:cancel:action");
        }
    });
    return ModalView;
});
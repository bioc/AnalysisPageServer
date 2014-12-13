/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "config",
    "views/modals/createModalView",
    "bootstrap"], 
    function(Backbone, Bacon, config,
    createModalView) {
        
        
    var AppView = Backbone.View.extend({
        events:     {
            "keydown":      "onKeydown"
        },
        initialize: function(opts) {
            opts.withNavbarFixedTop && this.$el.addClass("with-navbar-fixed-top");
            this.title = opts.title;
            this.pageTitlePrefix = opts.pageTitlePrefix;
            this.eventBus = opts.eventBus;
            this.initializeEventBus();
            this.pageViews = [];
            this.pages = opts.pages;
            this.listenTo(this.pages, "page:analysis:failed", this.onPageAnalysisFailed);
            $(window).on("error", _.bind(this.onError, this));
        },
        /**
         * Scrollspy is initialized for standalone deployments of EP
         * where multiple "pages" display in one physical document
         * @returns {undefined}
         */
        initializeScrollspy:    function() {
            this.$el.scrollspy({
                target: "header",
                offset: 70
            });
        },

        initializeEventBus: function() {
//            this.eventBus.onValue(console, "log", "EVENTBUS");
            // this is a special case of router event for standalone deployment
            // handled here and not in a router
            function selectPageView(view, e) {
                view.selectPageView(e.withScroll, e.pageModel);
            }
            this.eventBus
                    .filter(".router")
                    .filter(".navigateToPageView")
                    .filter(this.model, "isEnv", "analysis-page-server-static")
                    .onValue(selectPageView, this);
        },

        selectPageView: function(withScroll, pageModel) {
            var exists = _.find(this.pageViews, function(pv) {
                return pv.model === pageModel;
            });
            if (exists) {
                this.pages.setActive(pageModel);
                this.setTitle(pageModel);
                if (withScroll) {
                    var o = $("#"+pageModel.get("name")+"-page-view").offset();
                    o && o.top && $(window).scrollTop(o.top-70);
                }
            }
            else {
                
            }
        },

        removePageViews:    function() {
            var removeESArray = [];
            _.each(this.pageViews, function(pv) {
                pv.removeWithAnimation();
                removeESArray.push(pv.asEventStream("after:remove").take(1));
            });
            this.pageViews = [];
            return removeESArray.length ? Bacon.combineAsArray(removeESArray) : Bacon.once("No PageViews to remove.");
        },

        /**
         * @param {PageView} pageView
         * @param {Object} opts
         * @returns {undefined} 
         */
        setPageView:   function(pageView, $container) {
            this.removePageViews();
            this.pages.setActive(pageView.model);
            this.setTitle(pageView.model);
            this.appendPageView(pageView, {$container: $container});
        },
                
        appendPageView: function(pageView, opts) {
            opts = opts || {};
            opts.$container || (opts.$container = $("#wrap").children(".container-fluid"));
            opts.$container.append(pageView.$el);
            // do not keep reference to nested dataset page view 
            pageView.model.collection.parentPageModel || this.pageViews.push(pageView);
        },
                
        showModalWindow:    function(opts) {
            var modal = createModalView(_.extend({
                className:  "modal hide fade"
            }, opts));
            var view = this;
            this.listenToOnce(modal, "hidden", function() {
                view.activeModal = null;
            });
            this.$el.append(modal.$el);
            
            if (this.activeModal) {
                this.listenToOnce(this.activeModal, "hidden", function() {
                    modal.render();
                    view.activeModal = modal;
                });
                this.activeModal.hide();
            }
            else {
                this.activeModal = modal;
                modal.render();
            }
            return modal;
        },
          
        hideModalWindow:    function() {
            this.activeModal && this.activeModal.hide();
        },
        
        setTitle:   function(page) {
            clearTimeout(this.titleTimer);
            var title = "";
            if (page.get("hidden")) {
                title = this.title;
            }
            else {
                title = this.pageTitlePrefix + page.get("label");
            }
            $("head > title").text(title);
        },
                
        setPageCopy:    function(copy) {
            $("#ep-analysis-page-copy-row > .span7").html(copy);
        },
                
        remove: function() {
            Backbone.View.prototype.remove.call(this);
        },
                
        /**
         * Prevents accidental Backspace that moves back in History
         * @param {type} e
         * @returns {undefined}
         */
        onKeydown:  function(e) {
            if (e.which === 8 && _.indexOf(["INPUT", "TEXTAREA"], e.target.tagName) === -1) {
                e.preventDefault();
            }
        },
        onError:    function(e) {
//            console.log("AppView.onError", e);
//            alert(e.message);

        },
                
        onPageAnalysisFailed:   function(page, jqXHR) {
            this.showModalWindow({
                modalType:      "error",
                backdrop:       false,
                withClose:      true,
                title:          "Oops, an error occured",
                doBtnLabel:     "Send an email about this?",
                cancelBtnLabel: "Cancel",
                fullErrorText:  jqXHR.responseText,
                pageModel:      page
            });
            this.setTitle(this.pages.getActive() || this.pages.get("landing"));
        }
    });
    return AppView;
});
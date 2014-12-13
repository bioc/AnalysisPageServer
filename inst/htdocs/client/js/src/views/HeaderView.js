/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "config", "TemplateManager", "bootstrap"], 
function(Backbone, config, TemplateManager) {
    var Header = Backbone.View.extend({
        pages:          null,
        events:         {
            "click a.brand":                     "onClickBrand",
            "click #ep-header-help a":           "onClickHelp",
            "click #ep-header-tools-menu a":     "onClickTool",
            "click #ep-header-options-menu a":   "onClickOption"
        },
        initialize:     function(opts) {
            this.eventBus = opts.eventBus;
            this.appView = opts.appView;
            this.appModel = this.appView.model;
            this.pages = opts.pages;
            this.initializeReactiveProperties();
            this.$("#ep-header-help a").attr("href", config["help.link"]);
            this.listenTo(this.pages, "sync", this.onPagesSync);
            this.listenTo(this.pages, "page:activated", this.onPageActivated);
            this.listenTo(this.appModel, "change:mode", this.onAppModelChangeMode);
            opts.fixedTop && this.$el.addClass("navbar-fixed-top");
        },
        initializeReactiveProperties:   function() {
            function mapToPageName(e) {
                return $(e.currentTarget).find("li.active > a[data-name]").attr("data-name");
            }
            function disactivateRootLi(e) {
                $(e.currentTarget).removeClass("active");
            }
            var scrollspyActivateES = this.$el.asEventStream("activate", "li");
            scrollspyActivateES
                    // it's unneeded default scrollspy behavior
                    .doAction(disactivateRootLi)
                    .map(mapToPageName)
                    .onValue(this, "selectTool", false);
        },
        render: function() {
            this.renderOptionsMenu();
        },
        renderToolsMenu:    function() {
            var items = this.pages.map(function(page) {
                if (! page.get("in_menu")) return "";
                return TemplateManager.render("ep-list-item-tmpl", {
                    name:   page.get("name"),
                    href:   page.get("name")+"-page-view",
                    label:  page.get("label"),
                    active: page === this.pages.getActive()
                });
            }, this);
            var $menu = this.$("#ep-header-tools-menu > ul");
            $menu.html(items);
            $menu.prev().dropdown();
        },
        renderOptionsMenu:  function() {
            var simpleSet = this.appModel.get("mode") === "simple";
            var menu = [{label: "Mode", menu: [{label: "Simple", active: simpleSet, attrs: [{name: "data-mode", value: "simple"}]}, {label: "Advanced", active: !simpleSet, attrs: [{name: "data-mode", value: "advanced"}]}]}];
            function renderMenu(menu) {
                return _.map(menu, function(item) {
                    var $renderedItem = $(TemplateManager.render("ep-list-item-tmpl", item));
                    if (item.menu) {
                        var $ul = $("<ul></ul>");
                        $ul.addClass("dropdown-menu");
                        $renderedItem.addClass("dropdown-submenu");
                        $ul.html(renderMenu(item.menu));
                        $renderedItem.append($ul);
                    }
                    return $renderedItem;
                });
            }
            var $menu = this.$("#ep-header-options-menu > ul");
            $menu.html(renderMenu(menu));
            $menu.prev().dropdown();
        },
        selectTool:        function(withScroll, pageName) {
            var page = this.pages.get(pageName);
            if (page) {
                var e = {
                    router:             true,
                    navigateToPageView: true,
                    pageModel:          page,
                };
                if (this.appModel.isEnv("analysis-page-server-static")) {
                    this.eventBus.push(_.extend(e, {
                        withScroll: withScroll
                    }));
                }
                else {
                    this.eventBus.push(_.extend(e, {
                        primary:    true,
                        trigger:    true
                    }));
                }
            }
        },
                 
        setSubtitle: function(subtitle) {
            this.$(".navbar-text").text(subtitle);
        },
        
        onClickTool:    function(e) {
            var $a = $(e.target),
                pageName = $a.attr("data-name");
            e.preventDefault();
            this.selectTool(true, pageName);
        },
          
        onClickBrand:   function(e) {
            this.eventBus.push({
                router:             true,
                navigateToPageView: true,
                landing:            true,
                trigger:            true
            });
            e.preventDefault();
        },
                  
        onPageActivated:    function(prevPage, page) {
            var $menu = this.$("#ep-header-tools-menu > ul");
            $menu.children().removeClass("active");
            $menu.find("a[data-name='"+page.get("name")+"']").parent().addClass("active");
            this.setSubtitle(page.get("hidden") ? "" : page.get("label"));
        },
                
        onAppModelChangeMode:   function(model, mode) {
            this.$("#ep-header-options-menu")
                    .find("[data-mode="+mode+"]").addClass("active")
                    .siblings().removeClass("active");
        },
                
        onClickOption:  function(e) {
            var $li = $(e.currentTarget).parent();
            e.preventDefault();
            if ($li.attr("data-mode")) {
                this.appModel.set("mode", $(e.currentTarget).parent().attr("data-mode"));
                this.appModel.save();
            }
        },
                
        onClickHelp:    function() {
            
        },
        
        onPagesSync:    function() {
            this.renderToolsMenu();
        }
    });
    return Header;
});
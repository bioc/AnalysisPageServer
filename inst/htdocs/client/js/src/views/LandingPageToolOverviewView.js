/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager"], function(Backbone, TemplateManager) {
    var LandingPageToolOverview = Backbone.View.extend({
        events:         {
            "click .nav-list a":           "onClickName",
            "click .span7 > .media":       "onClickDesc",
            "mouseenter .nav-list a":      "onMouseenterName",
            "mouseleave":                  "onMouseleave"
        },
        initialize:     function(opts) {
            this.eventBus = opts.eventBus;
            this.pages = opts.pages;
            this.appView = opts.appView;
        },
                
        showToolDesc:   function($name) {
            var name = $name.attr("data-name");
            $name.parent().addClass("active");
            $name.parent().siblings().removeClass("active");
            this.$(".span7").children().hide()
                .filter('[data-name="'+name+'"]').show();
        },
                
        hideToolDescs:  function() {
            this.$(".span7").children().hide();
        },
                
        selectTool:        function(name) {
            var page = this.pages.findWhere({name: name});
            this.eventBus.push({
                router:             true,
                navigateToPageView: true,
                primary:            true,
                pageModel:          page,
                trigger:            true
            });
        },
                
        render: function() {
            var templates;
            this.renderSkeleton();
            templates = this.pages.map(function(page) {
                if (! page.get("in_menu")) return "";
                return TemplateManager.render("ep-list-item-tmpl", {
                    label:  page.get("label"),
                    name:   page.get("name"),
                    strong: true,
                    href:   page.get("name")
                });
            });
            
            this.$(".nav-list").html(templates.join(""));
            this.$(".nav-list").children().first().addClass("active");
            
            templates = this.pages.map(function(page) {
                if (page.get("hidden")) return "";
                return TemplateManager.render("ep-landing-tool-overview-body-tmpl", {
                    label:  page.get("label"),
                    name:   page.get("name"),
                    description:    page.get("description"),
                    thumbnail:      page.get("thumbnail")
                });
            });
            
            this.$(".span7").html(templates.join(""));
            this.$(".span7").children().first().show();
        },
        
        renderSkeleton: function() {
            this.$el.html(TemplateManager.render("ep-tool-overview-tmpl"));
        },
        
        onClickName:    function(e) {
            e.preventDefault();
            var $a = $(e.currentTarget);
            this.selectTool($a.attr("data-name"));
        },        
        
        onClickDesc:    function(e) {
            e.preventDefault();
            var $desc = $(e.currentTarget);
            this.selectTool($desc.attr("data-name"));
        },        
        
        onMouseenterName:   function(e) {
            this.showToolDesc($(e.currentTarget));
        },
                
        onMouseleave:   function(e) {
    
        }
    });
    return LandingPageToolOverview;
});
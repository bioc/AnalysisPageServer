/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import "bootstrap";

export default Marionette.Behavior.extend({
    defaults: {
        elSelector: "",
        triggerSelector: "",
        mode: "popover",
        popoverTitle: "",
        popoverContainer: ""
    },

    events() {
        var s = this.getOption("triggerSelector");
        return _.object(["mouseenter "+s, "mouseleave "+s],
                    ["onMouseenter", "onMouseleave"]);
    },

    initialize() {
        this.options.popoverContainer = this.options.popoverContainer || this.$el;
        let elSelector = this.options.elSelector;
        this.options.elSelector = elSelector ? elSelector + ":not([data-expandable-text])" : "";
    },

    getFullElSelector() {
        return this.getOption("triggerSelector")+" "+this.getOption("elSelector");
    },

    isExpansionNecessary($expandableEl) {
        this.renderSimple($expandableEl);
        let textWidth = $expandableEl.innerWidth()
                                - parseInt($expandableEl.css("paddingLeft"))
                                - parseInt($expandableEl.css("paddingRight"));

        return $expandableEl.siblings("[data-expandable-text]").width() - 5 > textWidth;
    },

    isModePopover() {
        return this.getOption("mode") == "popover";
    },

    isModeSimple() {
        return this.getOption("mode") == "simple";
    },

    renderPopover($expandableEl) {
        if (! $expandableEl.data("popover")) {
            $expandableEl.popover({
                trigger: "manual",
                title: this.getOption("popoverTitle"),
                content: function() {
                    return $expandableEl.text();
                },
                placement: "top",
                container: this.getOption("popoverContainer")
            });
            this.once("before:destroy", () => $expandableEl.popover("destroy"));
        }
    },

    renderSimple($expandableEl) {
        var $ext = $expandableEl.siblings("[data-expandable-text]");
        if ($ext.length == 0) {
            $ext = $("<div data-expandable-text></div>");
            $ext.css({
                position: "absolute",
                visibility: "hidden",
                zIndex: 10
            });
            $expandableEl.parent().prepend($ext);
        }
        $ext.html($expandableEl.html());
    },

    hide($t) {
        var $el = this.getOption("elSelector") ? $t.find(this.getOption("elSelector")) : $t;
        if (this.isExpansionNecessary($el)) {
            if (this.isModePopover()) {
                $el.popover("hide");
            }
            else {
                $el.siblings("[data-expandable-text]")
                    .removeClass("label")
                    .css("visibility", "hidden");
            }
        }
    },

    onEmphasizeExpandedText(yes, $el, cssClass) {
        $el.siblings("[data-expandable-text]")[yes ? "addClass" : "removeClass"](cssClass);
    },

    onMouseenter(e) {
        var $t = $(e.currentTarget);
        var $el = this.getOption("elSelector") ? $t.find(this.getOption("elSelector")) : $t;
        if (this.isExpansionNecessary($el)) {
            if (this.isModePopover()) {
               this.renderPopover($el);
                $el.popover("show");
            }
            else {
                $el.siblings("[data-expandable-text]")
                    .addClass("label")
                    .css("visibility", "visible");
            }
        }
    },
    onMouseleave(e) {
        this.hide($(e.currentTarget));
    },
    onExpandableTextHide(data) {
        this.hide(data.triggerElement);
    }
});

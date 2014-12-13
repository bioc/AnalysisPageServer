/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "TemplateManager"], function(Backbone, TemplateManager) {
    var FilterView = Backbone.View.extend({
        timer:  null,
        $clearButton:   null,
        $textfield:     null,
        events: {
            "keyup input":  "onTextchange",
            "paste input":  "onTextchange",
            "cut input":    "onTextchange",
            "click button": "onClickButton"
        },
        render: function() {
            var v = "";
            switch (this.model.get("type")) {
                case "numeric":
                case "integer":
                    v = TemplateManager.render("ep-numeric-filter-tmpl", {
                        ge: this.model.get("subtype") === "min",
                        le: this.model.get("subtype") === "max"
                    });
                    break;
                default:
                    v = TemplateManager.render("ep-character-filter-tmpl");
                    break;
            }
            this.$el.append(v);
            this.$textfield = this.$("input[type=text]");
            this.$clearButton = this.$("button");
            this.$clearButton.hide();
        },
                
        focus:  function() {
            this.$textfield.focus();
        },
                
        onTextchange:   function(e) {
            var view = this;
            clearTimeout(this.timer);
            this.timer = setTimeout(function() {
                if (e.target.value.length) {
                    view.model.set("value", e.target.value);
                    view.$clearButton.show();
                }
                else {
                    view.model.unset("value");
                    view.$clearButton.hide();
                }
            }, 300);
        },
                
        onClickButton:  function() {
            this.model.unset("value");
            this.$clearButton.hide();
            this.$textfield.val("");
        },
                
        update:    function() {
            if (this.model.has("value")) {
                this.$clearButton.show();
                this.$textfield.val(this.model.get("value"));
            }
            else {
                this.$clearButton.hide();
                this.$textfield.val("");
            }
        }
    });
    return FilterView;
});
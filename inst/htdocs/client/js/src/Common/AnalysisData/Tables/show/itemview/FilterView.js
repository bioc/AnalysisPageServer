/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon.jquery"], function(Marionette, bjq) {
    return Marionette.ItemView.extend({
        getTemplate: function() {
            switch (this.model.get("type")) {
                case "numeric":
                case "integer":
                    return "#ep-numeric-filter-tmpl";
                default:
                    return "#ep-character-filter-tmpl";
            }
        },
        
        className: "input-prepend",
        
        ui: {
            clearBtn: "button",
            textfield: "input[type=text]"
        },

        events: {
            "keydown @ui.textfield": "onTextfieldKeydown",
            "click @ui.clearBtn": "_onClickClearBtn"
        },
        
        modelEvents: {
            "change:value": "_onModelChangeValue"
        },
        
        templateHelpers: function() {
            switch (this.model.get("type")) {
                case "numeric":
                case "integer":
                    return {
                        ge: this.model.get("subtype") === "min",
                        le: this.model.get("subtype") === "max"
                    };
                default:
                    return {};
            }
        },
        
        onRender: function() {
            this.ui.clearBtn.hide();
            bjq.textFieldValue(this.ui.textfield, this.model.get("value"))
                    .takeUntil(this.getDestroyES())
                    .debounce(300)
                    .onValue(this, "_onTextchange");
        },
        
        onTextfieldKeydown: function(e) {
            // prevent accidental zoom out/in on plot
            e.stopPropagation();
        },
        
        getDestroyES: function() {
            return this.asEventStream("before:destroy").take(1);
        },
        
        focus: function() {
            this.ui.textfield.focus();
        },
                
        _onTextchange: function(value) {
            if (value !== "") {
                this.model.set("value", value);
                this.ui.clearBtn.show();
            }
            else {
                this.model.unset("value");
                this.ui.clearBtn.hide();
            }
        },
                
        _onClickClearBtn: function(e) {
            e.preventDefault();
            this.model.unset("value");
            this.ui.clearBtn.hide();
            this.ui.textfield.val("");
        },

        _onModelChangeValue: function() {
            this.update();
        },

        update: function() {
            if (this.model.has("value")) {
                this.ui.clearBtn.show();
                this.ui.textfield.val(this.model.get("value"));
            }
            else {
                this.ui.clearBtn.hide();
                this.ui.textfield.val("");
            }
        }
    });
});
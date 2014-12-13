/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["views/parameters/select/SelectParameterView", "TemplateManager", 
"Sortable",
"bacon.jquery", "select2"], 
function(ParentView, TemplateManager, Sortable) {
    var DropdownSelectParameterView = ParentView.extend({

        initialize: function() {
            ParentView.prototype.initialize.apply(this, arguments);
            this.initializeDomEventStreams();
        },
        
        initializeDomEventStreams: function() {
            this.$el.asEventStream("change", "#"+this.cid)
                    .takeUntil(this.beforeRemoveES)
                    .map(".val")
                    .onValue(this, "_setModelValue");
            this.$el.asEventStream("select2-selecting", "#"+this.cid)
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "_actOnDropdownActions");
        },
        
        render: function() {
            var p = TemplateManager.render("ep-form-text-tmpl", {
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.model.get("label")+":",
                value:          this.model.get("value"),
                choices:        this._prepareChoices(),
                desc:           this.model.get("description"),
                size:           this.getSizeClass(),
                descSize:       this.getDescSize(),
//                tabindex:       this.options.tabindex+1,
                primary:        this.isPrimary()
            });
            this.$el.html(p);
            ParentView.prototype.render.call(this);
            this.$("#"+this.cid).select2(this.getSelect2Options());
            this.model.get("allow_multiple") && this.initializeSortable();
            this.model.get("allow_multiple") || this.initializePopover();
            this.updateSelectionFromModel();
        },
        
        remove: function() {
            this.$(".select2-container").popover("destroy");
            this.$("#"+this.cid).select2("destroy");
            ParentView.prototype.remove.call(this);
        },
        
        initializeSortable: function() {
            var $choiceContainer = this.$("ul.select2-choices");
            var s = new Sortable($choiceContainer[0]);
            $choiceContainer.asEventStream("update")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this.$("#"+this.cid), "select2", "onSortEnd");
        },
        
        _popoverContent: function() {
            return this.model.get("choices")[this.model.get("value")];
        },
        
        initializePopover: function() {
            this.$(".select2-container").popover({
                title:     this.model.get("label"),
                content:   _.bind(this._popoverContent, this),
                trigger:   "hover",
                placement: "top"
            });
        },
        
        updatePopover: function() {
            this.$(".select2-container").popover("setContent");
        },
        
        getSelect2Options: function() {
            return {
                multiple:       this.model.get("allow_multiple"),
                query:          _.bind(this._select2Query, this),
                placeholder:    this.model.get("prompt"),
                closeOnSelect:  ! this.model.get("allow_multiple"),
                formatResult:   _.bind(this._select2FormatResult, this),
            };
        },
        
        _actOnDropdownActions: function(e) {
            if (e.choice.id === "action-select-all") {
                // this action is available for the multiple
                e.preventDefault();
                this.model.selectAll();
                this.updateSelectionFromModel();
                this.$("#"+this.cid).select2("close");
            }
            else if (e.choice.id === "action-deselect-all") {
                // this action is available for the multiple
                e.preventDefault();
                this.model.deselectAll();
                this.$("#"+this.cid).select2("close");
            }
        },
        
        _select2Query: function(q) {
            function filterText(text) {
                return text && text.toLowerCase().indexOf(q.term.toLowerCase()) > -1;
            }
            function filterChoices(choices) {
                var listOfPairs = _.map(choices, function(text, val) {
                    return filterText(text) ? [val, text] : null;
                });
                return _.object(_.filter(listOfPairs, function(pair) {
                    return _.isArray(pair);
                }));
            }
            Bacon.once("void")
                    .map(this.model)
                    .map(".attributes.choices")
                    .map(filterChoices)
                    .map(this, "_select2MapChoices")
                    .map(this, "_updateDropdownActions")
                    .onValue(q, "callback");
        },
        
        _select2FormatResult: function(choice) {
            if (! choice.id && choice.text === " ") return "<hr/>";
            return choice.text;
        },
        
        isSelectAllAllowed: function() {
            var c = this.model.get("choices");
            return this.model.get("allow_multiple") 
                            && _.size(c) > 1 
                            && _.size(c) !== _.size(this.model.get("value"));
        },
        isDeselectAllAllowed: function() {
            return this.model.get("allow_multiple") 
                            && _.size(this.model.get("value")) > 1;
        },
          
        _select2MapChoices: function(choices) {
            var select2Result = {
                results: _.map(choices, function(text, val) {
                    return {
                        id:   val,
                        text: text
                    };
                })
            };
            return select2Result;
        },
        _updateDropdownActions: function(select2Results) {
            if (this.isSelectAllAllowed() || this.isDeselectAllAllowed()) {
                select2Results.results.unshift({
                    text: " "
                });
            }
            this.isSelectAllAllowed() &&
                select2Results.results.unshift({
                    id:   "action-select-all",
                    text: "Select All"
                });
            this.isDeselectAllAllowed() &&
                select2Results.results.unshift({
                    id:   "action-deselect-all",
                    text: "Deselect All"
                });
            return select2Results;
        },
        
        updateSelectionFromModel: function() {
            var data, value = this.model.get("value");
            if (this.model.get("allow_multiple")) {
                value = _.isArray(value) ? value : (value ? [value] : null);
                data = _.map(value, function(v, i) {
                    return {
                        id:   v,
                        text: this.model.get("choices")[v]
                    };
                }, this);
            }
            else {
                data = {
                    id:   value,
                    text: this.model.get("choices")[value]
                };
            }
            this.$("#"+this.cid).select2("data", data);
        },
        
        focus:  function() {
//            this.$("select").focus();
        },
        onModelChangeValue:  function() {
            this.updateSelectionFromModel();
            this.model.get("allow_multiple") || this.updatePopover();
        }
        
    });
    return DropdownSelectParameterView;
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 * 
 * The prototype chain is as follows:
 * 1. ComboboxParameterView
 * 2. ComboboxParameterNormalMixin, ComboboxParameterSelectMixin
 * 3. ComboboxParameterPrimaryMixin, ComboboxParameterSecondaryMixin, ComboboxParameterLandingMixin
 * 
 * The hierarchy isn't simple as can be seen.
 * ComboboxParameterViewFactory creates new instances of this type and
 * sets the prototype chain dynamically taking into account some variables.
 */
define(["views/parameters/ParameterView", "bacon", "TemplateManager", "config", "Sortable"], 
function(ParameterView, Bacon, TemplateManager, config, Sortable) {
    
    var ComboboxParameterView = ParameterView.extend({

        initialize: function() {
            ParameterView.prototype.initialize.apply(this, arguments);
            this.listenTo(this.model, "change:value", this.onModelChangeValue);
            this.listenTo(this.model, "fetch:suggestions:start", this.onModelFetchSuggestionsStart);
            this.listenTo(this.model, "fetch:suggestions:success", this.onModelFetchSuggestions);
            this.listenTo(this.model, "fetch:suggestions:fail", this.onModelFetchSuggestionsFail);
            this.initializeDomEventStreams();
            this.initializeQueryBus();
        },

        
        initializeDomEventStreams: function() {
            this.$el.asEventStream("change", "#"+this.cid)
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "_updateModelValue");
            this.$el.asEventStream("select2-selecting", "#"+this.cid)
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "_actOnDropdownActions");
            this.$el.asEventStream("select2-open", "#"+this.cid)
                    .merge(this.$el.asEventStream("select2-close", "#"+this.cid))
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this, "updatePopover");
        },
        
        initializeQueryBus: function() {
            this._queryBus = new Bacon.Bus();
            this._queryBus
                    .takeUntil(this.beforeRemoveES)
                    .debounce(this.model.get("delay.ms") || 300)
                    .flatMapLatest(this, "_mapQuery")
                    .map(this, "_select2MapSuggestions")
                    .map(this, "_updateDropdownActions")
                    .onValue(this, "_select2QueryCallback");
            // suggestions fetch is moved to the view so that only visible params
            // initialize requests
            this.model.isInitialized
                    .filter(_.isEqual, true)
                    .take(1)
                    .onValue(this.model, "getSuggestions");
        },
        
        remove: function() {
            this.$(".select2-container").popover("destroy");
            this.$("#"+this.cid).select2("destroy");
            ParameterView.prototype.remove.call(this);
        },
        
        render: function() {
            ParameterView.prototype.render.call(this);
            var p = TemplateManager.render(this.getTemplateName(), this.getTemplateOptions());
            this.$el.html(p);
            this.$("#"+this.cid).select2(this.getSelect2Options());
            this.model.get("allow_multiple") && this.initializeSortable();
            this.model.get("allow_multiple") || this.initializePopover();
            this.updateSelectionFromModel();
            this._ensurePlaceholderVisible();
        },
        
        _ensurePlaceholderVisible: function() {
            // ensure placeholder is visible at the beginning
            this.eventBus
                    .filter(".pageViewShown")
                    .take(1)
                    .takeUntil(this.getRemoveES())
                    .onValue(this.$(".select2-input"), "trigger", "blur");
        },
        
        initializeSortable: function() {
            var $choiceContainer = this.$("ul.select2-choices");
            var s = new Sortable($choiceContainer[0]);
            $choiceContainer.asEventStream("update")
                    .takeUntil(this.beforeRemoveES)
                    .onValue(this.$("#"+this.cid), "select2", "onSortEnd");
        },
        
        _popoverContent: function() {
            return this.model.get("readable");
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
            this.$(".select2-container").popover("hide");
        },
        
        _select2NextSearchTerm: function(data, currentSearchTerm) {
            return "";
        },
        
        _select2FormatResult: function(choice) {
            if (! choice.id && choice.text === " ") return "<hr/>";
            return choice.text;
        },
        
        
        _select2Query: function(q) {
            this._queryBus.push(q);
        },
        
        getSelect2Options: function() {
            return {
                multiple:           this.model.get("allow_multiple"),
                query:              _.bind(this._select2Query, this),
                placeholder:        this.model.get("prompt"),
                closeOnSelect:      false,
                dropdownAutoWidth:  true,
                separator:          "|_NO_AUTO_SEPARATOR_|",
                nextSearchTerm: _.bind(this._select2NextSearchTerm, this),
                formatResult:   _.bind(this._select2FormatResult, this)
            };
        },
        
        focus: function() {
//            this.$("#"+this.cid).select2("open");
        },
        
        getTemplateOptions: function() {
            return {
                className:  "control-group",
                baseId:         this.cid,
                name:           this.model.get("name"),
                label:          this.renderLabel(),
                desc:           this.renderDescription(),
                size:           this.getSizeClass(),
//                tabindex:       this.options.tabindex+1
            };
        },
        
        _getLoaderPosition: function() {
            return {
                top:  "3px",
                left: "6px"
            };
        },
        
        enableLoading:  function() {
            this.$el.addClass("ep-loading");
            var $loader = this.$(".controls > .ep-load-indicator");
            if (! $loader.length) {
                $loader = $(TemplateManager.render("ep-load-indicator-tmpl"));
                $loader.css(_.extend({
                    position:   "absolute"
                }, this._getLoaderPosition()));
                this.$(".controls").append($loader);
            }
        },
        
        disableLoading:  function() {
            this.$el.removeClass("ep-loading");
        },
        
               
        updateSelectionFromModel: function() {
            var data;
            if (this.model.get("allow_multiple")) {
                data = _.map(this.model.get("value"), function(v, i) {
                    return {
                        id:   v,
                        text: this.model.get("readable")[i]
                    };
                }, this);
                
            }
            else {
                data = {
                    id:   this.model.get("value"),
                    text: this.model.get("readable")
                };
            }
            
            this.$("#"+this.cid).select2("data", this.model.hasValue() ? data : null);
        },
          
        isSelectAllAllowed: function() {
            var s = this.model.get("suggestions");
            return this.model.get("allow_multiple") 
                            && _.size(s) > 1 
                            && _.size(s) !== _.size(this.model.get("value"));
        },
        isDeselectAllAllowed: function() {
            return this.model.get("allow_multiple") 
                            && _.size(this.model.get("value")) > 1;
        },
          
        _select2MapSuggestions: function(queryBusObj) {
            queryBusObj.select2Result = {
                results: _.map(queryBusObj.suggestions, function(s) {
                    return {
                        id:   s.id,
                        text: s.long_name
                    }
                })
            };
            
            return queryBusObj;
        },
        
        _select2QueryCallback: function(queryBusObj) {
            queryBusObj.query.callback(queryBusObj.select2Result);
        },
        
        _updateDropdownActions: function(queryBusObj) {
            if (this.isSelectAllAllowed() || this.isDeselectAllAllowed()) {
                queryBusObj.select2Result.results.unshift({
                    text: " "
                });
            }
            this.isSelectAllAllowed() &&
                queryBusObj.select2Result.results.unshift({
                    id:   "action-select-all",
                    text: "Select All"
                });
            this.isDeselectAllAllowed() &&
                queryBusObj.select2Result.results.unshift({
                    id:   "action-deselect-all",
                    text: "Deselect All"
                });
            
            return queryBusObj;
        },
          
        _updateModelValue: function(e) {
            this.model.updateFromView(_.pick(e, ["added", "removed", "val"]), {viewTriggered: true});
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
        
        onModelChangeValue: function(model, value, opts) {
            opts.unset && this.reset();
            this.updateSelectionFromModel();
        },
        onModelFetchSuggestionsStart:   function() {
            this.enableLoading();
        },
        onModelFetchSuggestions:   function() {
            this.disableLoading();
        },
        onModelFetchSuggestionsFail:   function(restClient, jqXHR) {
            this.disableLoading();
            this.$("#"+this.cid).select2("close");
            if (restClient.responseIsError(jqXHR.responseText)) {
                this.appView.showModalWindow({
                    modalType: "error",
                    fullErrorText: jqXHR.responseText,
                    backdrop:       false,
                    withClose:      true,
                    title:          "Error while populating '"+this.model.get("label")+"' options.",
                    doBtnLabel:     "Send an email about this?",
                    cancelBtnLabel: "Cancel"
                });
            }
        }
    }, {
        TYPE_LANDING:       22
    });
    
    return ComboboxParameterView;
    
});
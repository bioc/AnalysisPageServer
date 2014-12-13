/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["models/PageModel", "bacon", "collections/ParameterCollection", 
"analytics/AnalyticsFacade", "client/createClient"], 
function(PageModel, Bacon, ParameterCollection, AnalyticsFacade, createClient) {
    
    var AnalysisPageModel = PageModel.extend({
        defaults:       {
            sidebarVisible: true,
            tableVisible:   true
        },
        /**
         * @type ParameterCollection
         */
        parameters:     null,
        /**
         * Hash of TableDataModel objects visible on this page where keys
         * are models' view ids
         * @type Object
         */
        tables:         {},
        /**
         * 
         * @returns {undefined}
         */
        initialize: function(attrs, opts) {
            this.rClient = createClient("R");
            this.restClient = createClient("REST");
            this.appModel = opts.appModel;            
            this.parameters = new ParameterCollection(null, {
                appModel:   this.appModel,
                pageModel:  this
            });            
            PageModel.prototype.initialize.apply(this, arguments);
            this.initializeAnalysisBus();
            this.initializeCurrentAnalysisProperty();
            this.initializeHasEnsuredParameters();
            this.on("change:active", this.onChangeActive);
            this.listenTo(this.collection, "page:analysis:fetched", this.onPageAnalysisFetched);
        },
          
        initializeHasEnsuredParameters: function() {
            // ensure parameters request Bus
            this._ensureParametersBus = new Bacon.Bus();
            // Reactive Property
            this._hasEnsuredParameters = 
                    this._ensureParametersBus
                    .flatMapFirst(this, "_mapEnsureParametersToProperty")
                    .doAction(this, "initializeParameters")
                    .toProperty(this.isDataset());
        },
          
        _mapEnsureParametersToProperty: function(e) {
            return Bacon.fromPromise(this.parameters.fetch({
                url:        this.rClient.url(this.parameters.url, this.get("name")),
                remove:     false
            }))
            .map(true);
        },
          
        getDestroyES: function() {
            return this.asEventStream("destroy").take(1);
        },
          
        _mapAnalysisBusEvent: function(opts) {
            if (_.isObject(opts)) {
                return this._fetchAnalysisStream(opts);
            }
            else {
                return null;
            }
        },
          
        initializeAnalysisBus: function() {
            this._analysisBus = new Bacon.Bus();
            this._analysisBus
                    .takeUntil(this.getDestroyES())
                    .flatMapLatest(this, "_mapAnalysisBusEvent")
                    .filter(_.isArray)
                    .onValue(this, "_onAnalysisFetched");
        },
        
        initializeCurrentAnalysisProperty: function() {
            this._currentAnalysis = 
                    this.asEventStream("analysis:fetched", function(opts, analysis) {
                        return analysis;
                    })
                    // we don't want to store sometimes huge analysis JSON persistently
                    .merge(this.asEventStream("nullify:analysis").map(null))
                    .takeUntil(this.getDestroyES())
                    .toProperty(null);
            // important for property to get updated to have at least one listener
            this._currentAnalysis
                    .takeUntil(this.getDestroyES())
                    .onValue(function() {});
        },
        
        getCurrentAnalysis: function() {
            return this._currentAnalysis;
        },
        
        initializeEventBus: function() {
            this.eventBus
                    .filter(".abortRunningAnalysisRequests")
                    .onValue(this, "abortFetchAnalysis");
        },
        
        isDataset:    function() {
            return this.get("aps-analysis-dataset") || 
                    this.appModel.isEnv("analysis-page-server-static");
        },
        
        hasEnsuredParameters: function() {
            return this._hasEnsuredParameters;
        },
        
        /**
         * 
         * @returns {Bacon.EventStream}
         */
        ensureParameters: function() {
            this._hasEnsuredParameters
                    .filter(_.isEqual, false)
                    .onValue(this._ensureParametersBus, "push", "ensure");
            return this._hasEnsuredParameters
                    .filter(_.isEqual, true)
                    .map(this);
        },
            
        _makeNormalAnalysisStream: function(opts, parametersJson) {
            return Bacon.fromPromise(
                    this.parameters.sync("create", this.parameters, {
                        url:    this.rClient.url("analysis"),
                        data:   this.rClient.decoratePostParams(parametersJson, this.get("name")),
                        processData: true,
                    }),
                    true // abort request if possible 
                    );
        },
            
        _getNormalAnalysisStream:  function(opts) {
            // create actual JSON - there might be parameters that call display.callback
            return this.ensureParameters()
                    .flatMapLatest(this.parameters, "toJSON")
                    .flatMapLatest(this, "_makeNormalAnalysisStream", opts);
        },
                
        _getDatasetAnalysisStream:  function(opts) {
            var url = this.get("data_url") || opts.url;
            if (url) {
                return Bacon.fromPromise(this.parameters.sync("read", this.parameters, _.extend({
                    url:    url
                })));
            }
            else {// there might be a chance only plot_url was provided
                return Bacon.once({
                    type:   "plot",
                    label:  "Fake Plot Response - no 'data_url' provided.",
                    value:  {
                        plot:   this.get("plot_url"),
                        table:  {
                            type:   "table",
                            value:  {}
                        }
                    }
                });
            }
        },
        
        _fetchAnalysisStream: function(opts) {
            this.collection.trigger("page:analysis:fetch", this, opts);
            this.trigger("analysis:fetch", opts);
            var startTime = (new Date).getTime();
            var stream;
            if (this.isDataset()) {
                stream = this._getDatasetAnalysisStream(opts);
            }
            else {
                stream = this._getNormalAnalysisStream(opts);
            }
            stream.onError(this, "_onAnalysisError", opts);
            return Bacon.combineAsArray(
                    stream,
                    opts,
                    startTime
                    );
        },
        
        _saveParameters: function(parametersJson) {
            this.localModel.set("parameters", parametersJson);
            this.localModel.save();
        },
        
        _onAnalysisFetched: function(analysisOptsStartTimeArray) {
            var opts = analysisOptsStartTimeArray[1];
            if (! this.isDataset()) {
                var startTime = analysisOptsStartTimeArray[2];
                var endTime = (new Date).getTime();
                this.localModel.setAnalysisMeanLoadTime(endTime-startTime);
                this.parameters.toJSON("url")
                        .take(1)
                        .doAction(this, "_saveParameters")
                        .doAction(this.collection, "trigger", "page:analysis:fetched", this, opts, analysisOptsStartTimeArray[0])
                        .onValue(this, "trigger", "analysis:fetched", opts, analysisOptsStartTimeArray[0]);
            }
            else {
                this.collection.trigger("page:analysis:fetched", this, opts, analysisOptsStartTimeArray[0]);
                this.trigger("analysis:fetched", opts, analysisOptsStartTimeArray[0]);
            }
            opts.trackSuccess && this.trackSuccessfulAnalysis(endTime-startTime);
        },
        
        _onAnalysisError: function(opts, jqXHR) {
            if (jqXHR.textStatus === "abort") return;
            opts.trackFailure && this.trackFailedAnalysis(jqXHR.responseText, jqXHR.textStatus);
            this.collection.trigger("page:analysis:failed", this, jqXHR);
            this.trigger("analysis:failed", jqXHR);
        },
        /**
         * 
         * @param {type} opts
         * @returns {Bacon.EventStream}
         */
        fetchAnalysis: function(opts) {
            opts = opts || {};
            _.defaults(opts, {
                navigate:       true,
                trackSuccess:   true,
                trackFailure:   true
            });
            this.trigger("nullify:analysis");
            this._analysisBus.push(opts);
//            this._analysisBus.push(opts);
            return this._currentAnalysis
                    // I want here only meaningful values e.g. an analysis which is
                    // an object or server error that's represented by jqXHR
                    .filter(_.negate(_.isNull))
                    .take(1);
        },
        
        abortFetchAnalysis:   function() {
//            if (this.analysisPromise) this.analysisPromise.originalRequest.abort();
            this._analysisBus.push("abort");
        },
        
        addTable:   function(table) {
            this.tables[table.cid] = table;
        },
                
        initializeParameters: function() {console.log("AnalysisPageModel.initializeParameters", this.get("name"));
            if (!this.isDataset() && this.localModel.get("parameters")) {
                this.parameters.fromJSON(this.localModel.get("parameters"));
            }
        },
                
        initializePersistentParameters:   function(foreignPage) {
            function passValues(thisPage, foreignPage) {
                var affected = _.reduce(foreignPage.parameters.getPersistent(), function(affected, foreignParameter) {
                    var localParameter = thisPage.parameters.findWhere({name: foreignParameter.get("name")});
                    if (localParameter) {
                        foreignParameter.toJSON("url")
                            .take(1)
                            .onValue(localParameter, "fromJSON");
                    }
//                    localParameter && localParameter.fromJSON(foreignParameter.toJSON(null, "url"));
                    return affected || localParameter;
                }, false);
                if (affected && !thisPage.isDataset()) {
                    thisPage.parameters.toJSON("url")
                            .take(1)
                            .onValue(thisPage, "_saveParameters");
//                    thisPage.localModel.set("parameters", thisPage.parameters.toJSON("url"));
//                    thisPage.localModel.save();
                }
            }
            Bacon.combineAsArray(
                    foreignPage.ensureParameters(),
                    this.ensureParameters()
                    )
                    .onValue(passValues, this, foreignPage);
        },
                
        _trackSuccessfulAnalysis: function(time, parametersJson) {
            var studyModel = this.parameters.findWhere({name: "study"});
            AnalyticsFacade.trackEvent(
                this.get("label"), 
                studyModel ? studyModel.get("readable")+" - Success" : "Success",
                JSON.stringify(parametersJson),
                time
            );
        },
                
        trackSuccessfulAnalysis:    function(time) {
            this.parameters.toJSON()
                    .take(1)
                    .onValue(this, "_trackSuccessfulAnalysis", time);
//            AnalyticsFacade.trackEvent(
//                this.get("label"), 
//                studyModel ? studyModel.get("readable")+" - Success" : "Success",
//                JSON.stringify(this.parameters.toJSON()),
//                time
//            );
        },
                
        trackFailedAnalysis:    function(responseText, textStatus) {
            var studyModel = this.parameters.findWhere({name: "study"});
            if (_.indexOf(["abort", "aborted"], textStatus) === -1) {
                AnalyticsFacade.trackEvent(
                    this.get("label"), 
                    studyModel ? studyModel.get("readable")+" - Failed" : "Failed",
                    responseText);
            }
        },
                
        onChangeActive: function(model, active) {
            if (! active) {
                this.abortFetchAnalysis();
                // do not store full analysis response once it's unneeded
                this.trigger("nullify:analysis");
            }
        },
                
        onPageAnalysisFetched:  function(page) {
            if (page === this) return;
            this.initializePersistentParameters(page);
        }
        
    });
    
    
    return AnalysisPageModel;
});
/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["backbone", "bacon", "views/analysis/PageParameterView", 
    "views/pages/createPageView",
    "functions/transformers/transform3_5to3_6UrlParams", "backbone-query-parameters"], 
function(Backbone, Bacon, PageParameterView, 
    createPageView, transformParams) {
        
    function mapToPageView(appView, eventBus, type, pageAndAnalysis) {
        var page = _.isArray(pageAndAnalysis) ? pageAndAnalysis[0] : pageAndAnalysis;
        var pv, opts = {
                    type:       type,
                    appModel:   appView.model,
                    appView:    appView,
                    model:      page,
                    pages:      page.collection,
                    eventBus:   eventBus
                };
        _.isArray(pageAndAnalysis) && (opts.analysis = pageAndAnalysis[1]);
        pv = createPageView(opts);
        appView.setPageView(pv);
        return pv;
    }
    
    function toShownES(pageView) {
        pageView.showWithAnimation();
        return pageView.asEventStream("shown").take(1);
    }
        
    var Main = Backbone.Router.extend({
        routes:     {
            "":                                    "showLandingPageOrParseQS",
            "page/:page/primary(/:params)":        "showPrimaryPage",
            "page/:page/analysis/:params":         "showAnalysisPage",
            "page/:page/refresh/analysis/:params": "refreshAnalysisPage"
        },
        initialize: function(opts) {
            this.eventBus = opts.eventBus;
            this.initializeEventBus();
            this.pages = opts.pages;
            this.appView = opts.appView;
        },
        initializeEventBus: function() {

            this.getNavigateToPageViewES()
                    .filter(".primary")
                    .onValue(this, "_navigateToPrimaryPage");
            
            this.getNavigateToPageViewES()
                    .filter(".secondary")
                    .flatMapLatest(this, "_mapSecondaryPageToJson")
                    .onValue(this, "_navigateToSecondaryPage");
            // additional route for refreshing is needed as a user may want to
            // refresh currently being displayed analysis page
            this.getNavigateToPageViewES()
                    .filter(".refreshSecondary")
                    .flatMapLatest(this, "_mapSecondaryPageToJson")
                    .onValue(this, "_navigateToRefreshSecondaryPage");
            
            this.getNavigateToPageViewES()
                    .filter(".landing")
                    .onValue(this, "_navigateToLandingPage");
        },
        
        _navigateToPrimaryPage: function(e) {
            var parts = [
                "page",
                encodeURIComponent(e.pageModel.get("name")),
                "primary"
            ];
            this.navigate(parts.join("/"), _.pick(e, ["trigger"]));
        },
        
        _navigateToLandingPage: function(e) {
            this.navigate("", _.pick(e, ["trigger"]));
        },
        
        _navigateToSecondaryPage: function(eventJsonPair) {
            var pageModel = eventJsonPair[0].pageModel;
            var parts = [
                "page",
                encodeURIComponent(pageModel ? pageModel.get("name") : eventJsonPair[0].pageName),
                "analysis",
                encodeURIComponent(JSON.stringify(eventJsonPair[1]))
            ];
            this.navigate(parts.join("/"), _.pick(eventJsonPair[0], ["trigger"]));
        },
        _navigateToRefreshSecondaryPage: function(eventJsonPair) {
            var parts = [
                "page",
                encodeURIComponent(eventJsonPair[0].pageModel.get("name")),
                "refresh",
                "analysis",
                encodeURIComponent(JSON.stringify(eventJsonPair[1]))
            ];
            this.navigate(parts.join("/"), _.pick(eventJsonPair[0], ["trigger"]));
        },
        
        _mapSecondaryPageToJson: function(e) {
            var readyJson = e.paramsJson;
            return Bacon.combineAsArray(
                    e,
                    readyJson || e.pageModel.parameters.toJSON("url")
                    );
        },
        getNavigateToPageViewES: function() {
            return this.eventBus
                    .filter(".router")
                    .filter(".navigateToPageView");
        },
        showLandingPageOrParseQS:   function(oldFashionedQueryParams) {
            function redirectIfOldQS(page, params) {
                var l = window.location;
                l.search && l.replace(l.protocol+"//"+l.host+l.pathname+"#page/"+page+"/analysis/"+encodeURIComponent(params));
            }
            var router = this;
            if (oldFashionedQueryParams) {
                transformParams(oldFashionedQueryParams.params, function(err, transformedParams) {
                    if (err) {
                        router.appView.showModalWindow({
                            modalType:      "error",
                            fullErrorText:  err.message,
                            title:          "Error while transforming URL"
                        });
                    }
                    else
                        redirectIfOldQS(oldFashionedQueryParams.page, transformedParams);
                });
            }
            else
                this.showLandingPage();
        },
        showLandingPage:    function() {
            this.createLandingPageViewES(this.pages.get("landing"));
        },
        showPrimaryPage:    function(pageName, serializedParams) {
            this.createPrimaryPageViewES(pageName, serializedParams);
        },
        showAnalysisPage:   function(pageName, serializedParams) {
            this.createAnalysisPageViewES(pageName, serializedParams);
        },
        refreshAnalysisPage: function(pageName, serializedParams) {
            this.eventBus.push({
                router:             true,
                navigateToPageView: true,
                secondary:          true,
                pageName:           pageName,
                paramsJson:         serializedParams,
                trigger:            true
            });
        },

        createFetchPagesES: function() {
            if (! this.fetchPagesPromise) {
                this.fetchPagesPromise = this.pages.fetch({
                    // opts for soon-to-be-created PageModels
                    appModel:   this.appView.model, 
                    eventBus:   this.eventBus,
                    remove:     false
                });
            }
            this.eventBus.push({
                abortRunningAnalysisRequests:   true
            });
            return Bacon.fromPromise(this.fetchPagesPromise);
        },
        
        _mapToPage: function(pageName) {
            return this.pages.get(pageName);
        },
        
        createPrimaryPageViewES:    function(pageName, serializedParams) {
            Bacon.combineAsArray(
                    this.createFetchPagesES(),
                    this.appView.removePageViews()
                    )
                    // now after fetching pages collection I can get a model
                    .map(this, "_mapToPage", pageName)
                    .flatMapLatest(".ensureParameters")
                    .doAction(this, "_readSerializedParameters", serializedParams)
                    .map(mapToPageView, this.appView, this.eventBus, "primary")
                    .doAction(".render")
                    .take(1)
                    .onValue(toShownES);
        },
        
        _mapPageToAnalysis: function(serializedParams, pageModelCurrentAnalysisPair) {
            var pageModel = pageModelCurrentAnalysisPair[0];
            var analysis = pageModelCurrentAnalysisPair[1];
            if (_.isNull(analysis)) {
                this._readSerializedParameters(serializedParams, pageModel);
                this.showAnalysisModalView(pageModel);
                return Bacon.combineAsArray(
                    pageModel, 
                    pageModel.fetchAnalysis()
                            ).take(1);
            }
            else {
                return Bacon.combineAsArray(pageModel, analysis).take(1);
            }
        },
        
        _saveCaption: function(pageAnalysisPair) {
            var a = pageAnalysisPair[1];
            var page = pageAnalysisPair[0];
            switch (a.type) {
                case "plot":
                    page.set("topmostCaption", a.value.table.value.caption);
                    break;
                case "table":
                    page.set("topmostCaption", a.value.caption);
                    break;
            }
        },
        
        createAnalysisPageViewES:    function(pageName, serializedParams) {
            Bacon.combineAsArray(
                    this.createFetchPagesES(),
                    this.appView.removePageViews()
                    )
                    // now after fetching pages collection I can get a model
                    .map(this, "_mapToPage", pageName)
                    .flatMapLatest(".ensureParameters")
                    .flatMapLatest(this, "_getCurrentAnalysis")
//            .log("MainRouter._getCurrentAnalysis", pageName, serializedParams)
                    .flatMapLatest(this, "_mapPageToAnalysis", serializedParams)
                    .take(1)
                    .onValue(this, "_onAnalysisResponse");
        },
        
        _analysisResponseIsSuccessful: function(pageAnalysisPair) {
            var a = pageAnalysisPair[1];
            return _.isObject(a) && _.has(a, "type") && _.has(a, "value") && _.has(a, "name");
        },
        
        _onAnalysisResponse: function(pageAnalysisPair) {
            if (this._analysisResponseIsSuccessful(pageAnalysisPair)) {
                this._onAnalysisFetched(pageAnalysisPair);
            }
            else {
                this._onAnalysisError(pageAnalysisPair);
            }
        },
        
        _onAnalysisFetched: function(pageAnalysisPair) {
            this._saveCaption(pageAnalysisPair);
            var pageView = mapToPageView(this.appView, this.eventBus, "secondary", pageAnalysisPair);
            pageView.render();
            toShownES(pageView)
                    .onValue(this.appView, "hideModalWindow");
        },
        
        _onAnalysisError: function(pageJqXHRPair) {
//            pageJqXHRPair[0].trigger("nullify:analysis");
        },
        
        _getCurrentAnalysis: function(pageModel) {
            return Bacon.combineAsArray(
                    pageModel,
                    pageModel.getCurrentAnalysis()
                    ).take(1);
        },
        
        _readSerializedParameters: function(serializedParams, pageModel) {
            if (serializedParams) {
                // I need to know if there are any advanced parameters in the URL;
                // this acts like a trigger to switch appModel mode between simple/advanced
                var nbEncounteredAdvanced = 0;
                this.listenTo(pageModel.parameters, "parameter:value:from:json", function(parameterModel) {
                    if (parameterModel.get("advanced") || parameterModel.anyParentIsAdvanced()) {
                        nbEncounteredAdvanced++;
                    }
                });
                
                pageModel.parameters.fromJSON(JSON.parse(serializedParams));
console.log("MainRouter._readSerializedParameters", pageModel.get("name"), 
pageModel.parameters.findWhere({name: "study"}).get("value"),
JSON.parse(serializedParams), nbEncounteredAdvanced);
                this.stopListening(pageModel.parameters, "parameter:value:from:json");

                nbEncounteredAdvanced > 0 && this.appView.model.setMode("advanced");
                nbEncounteredAdvanced === 0 && this.appView.model.setMode("simple");
            }
        },
        
        createLandingPageViewES:    function(page) {
            function ensureSpecificParametersES(es) {
                return this.appView.model.isEnv("expressionplot") ? 
                    es.map(this, "_mapToPage", "study.summary")
                      .flatMapLatest(".ensureParameters") 
                    : 
                    es;
            }
            Bacon.combineAsArray(
                    ensureSpecificParametersES.call(this, this.createFetchPagesES()),
                    this.appView.removePageViews()
                    )
                    .map(page)
                    .map(mapToPageView, this.appView, this.eventBus, "landing")
                    .doAction(".render")
                    .take(1)
                    .onValue(toShownES);
        },
        showAnalysisModalView:  function(page) {
            var modal = this.appView.showModalWindow({
                title:  "Initializing "+page.get("label")+" Page...",
                cancelBtnLabel: "Go to Landing Page instead",
                progressBar:    page.localModel.get("analysisMeanLoadTime")
            });
            var cancelActionES = modal.asEventStream("do:cancel:action").take(1);
            cancelActionES
                    .onValue(this.eventBus, "push", {
                        router:             true,
                        navigateToPageView: true,
                        landing:            true,
                        trigger:            true
                    });
            var modalBody = new PageParameterView({
                className:  "light-blue",
                model:      page,
                noModify:   true
            });
            modalBody.render();
            modal.setBody(modalBody);
        }
    });
    return Main;
});
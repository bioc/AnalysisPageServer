/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";
import PersistentParameterCollection from "./models/PersistentParameterCollection";

const WEEK = 1000*60*60*24*7;

export default Marionette.Controller.extend({
    initialize() {
        // one unique collection across whole app, its parameters are
        // persistent through different pages
        this.collection = new PersistentParameterCollection();
        this.collection.fetch();
        app.channel.reply("parameters:conditional-persistent:initialize", this.initializeParameter, this);
        app.channel.reply("pages:parameters:conditional-persistent:update", this.update, this);
        app.channel.on("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    onDestroy() {
        this.collection.reset();
        app.channel.stopReplying("parameters:conditional-persistent:initialize");
        app.channel.stopReplying("pages:parameters:conditional-persistent:update");
        app.channel.off("parameters:dependency-changed-value", this.onDependencyChangedValue, this);
    },
    initializeParameter(parameter) {
        if (! this.canStoreConditionalValue(parameter)) return;
        let persistentParameter = this.getPersistentParameterFor(parameter);
        this.ensureValuesArePropagated(parameter, persistentParameter);
    },
    isNonConditional(parameter) {
        // do not use here getPersistentDependencies() as it caches deps
        return _.isEmpty(_.without(parameter.getPersistentDependenciesNames(), parameter.get("name")));
    },
    ensureValuesArePropagated(parameter, persistentParameter) {
        let valueEntry = persistentParameter.findConditionalValue(parameter);
        if (valueEntry) {// initialize both non-conditional (like Study)
            // and conditional parameters (like Pheno Fields) with persisted value;
            // it overwrites the value got from the Page Model's last submitted
            parameter.fromJSON(valueEntry.value);
        }
        parameter.listenTo(persistentParameter, "update:conditionalValue",
            (persistentParameter, triggeringParameter) => {
            // also remember to propagate value after persisted model has changed
                if (triggeringParameter.collection !== parameter.collection) {
                    // only propagate value to other collections - 4way tool
                    // is an example where there are two study persistent params
                    let valueEntry = persistentParameter.findConditionalValue(parameter);
                    parameter.fromJSON(valueEntry.value);
                }
            }
        );
    },
    update(pageModel) {
        this.storeConditionalValues(pageModel);
        this.clearOldConditionalValues();
    },
    getPersistentParameterFor(parameter) {
        if (! this.canStoreConditionalValue(parameter)) return null;
        let persistentParameter = this.collection.get(parameter.get("persistent"));
        if (! persistentParameter) {
            // it wasn't yet encountered
            persistentParameter = this.collection.create({
                id: parameter.get("persistent")
            });
        }
        return persistentParameter;
    },
    canStoreConditionalValue(parameter) {
        return parameter.get("persistent");
    },
    clearOldConditionalValues() {
        var valuesToStay;
        this.collection.each(persistentParameter => {
            valuesToStay = _.filter(persistentParameter.get("conditionalValues"), conditionalValue => {
                return ! this._conditionalValueIsOld(conditionalValue);
            });
            persistentParameter.set("conditionalValues", valuesToStay);
            persistentParameter.save();
        });
    },
    _conditionalValueIsOld(conditionalValue) {
        // is older than a week
        return (new Date).getTime() - conditionalValue.lastUsed > WEEK;
    },
    storeConditionalValues(pageModel) {
        let storePromises = pageModel.parameters.map(
                                parameter => this.storeConditionalValue(parameter)
                            );
        Promise.all(storePromises).then(
                () => pageModel.parameters.trigger("store-persistent-values"));
    },
    storeConditionalValue(parameter) {
        var localModel = this.getPersistentParameterFor(parameter);
        if (! this.canStoreConditionalValue(parameter)) return Promise.resolve();
        return parameter.conditionalToJSON("url")
                .toPromise()
                .then(value => {
                    localModel.insertOrUpdateConditionalValue(parameter, value);
                });
    },
    anyDependencyHasOutdatedValue(parameter) {
        return _.some(parameter.getPersistentDependencies(), depParam => {
            return app.channel.request("parameters:has-outdated-value", depParam);
        });
    },
    onDependencyChangedValue(parameter, opts) {
        if (! this.isNonConditional(parameter)) this.run(parameter, opts);
    },
    run(parameter, opts) {
        if (! this.canStoreConditionalValue(parameter)) return;
        if (this.anyDependencyHasOutdatedValue(parameter)) return;
        var localModel = this.getPersistentParameterFor(parameter);
        var valueEntry = localModel.findConditionalValue(parameter);
        if (valueEntry) {
            parameter.fromJSON(valueEntry.value, null, opts);
        }
        else {// trigger event so SetValueController can execute
            parameter.setValue(parameter.getValue());
        }
    }
});

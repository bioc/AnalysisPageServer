/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["underscore"], function() {
    
    function transformComboboxEntry(json) {
        return {
            v:  json.real,
            r:  json.readable
        };
    }
    
    function transformSimpleParamEntry(json) {
        return json;
    }
    
    function prepareParentJson(base) {
        return _.isArray(base) ? [] : {};
    }
    
    function iterateJson(json, parentJson) {
        _.each(json, function(entry, name) {
            if (_.isObject(entry)) {
                if (entry.__simpleParamDump__) {
                    if (entry.real !== void 0) {
                        parentJson[name] = transformComboboxEntry(entry);
                    }
                    else {
                        throw new Error("Old-fashioned query parameter transforming failed at '"+name+"': "+JSON.stringify(entry));
                    }
                }
                else {
                    parentJson[name] = iterateJson(entry, prepareParentJson(entry));
                }
            }
            else {
                parentJson[name] = transformSimpleParamEntry(entry);
            }
        });
        return parentJson;
    }
    
    return function(stringifiedUrlParams, callback) {
        
        try {
            var urlParams = JSON.parse(stringifiedUrlParams);
            callback(null, JSON.stringify(iterateJson(urlParams, {})));
        }
        catch(e) {
            callback(e);
        }
    }
    
});
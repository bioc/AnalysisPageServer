/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */

importScripts("lib/underscore.js");


var facade = (function() {
    
    var tables = {};
    
    function error(msg) {
        throw new Error(msg);
    }
    
    function existy(obj) {
        return typeof obj !== "undefined" && obj !== null;
    }
    
    function precheck(obj) {
        check(obj, ["cmd", "id"]);
    }
    
    function check(obj, keys) {
        _.every(keys, function(key) {
            return _.has(obj, key) || error("No '"+key+"' key provided.");
        });
    }
    
    function tableCurretSize(id) {
        return _.size(tables[id].currentData);
    }
    
    function tableCurrentData(id, newData) {
        if (newData) tables[id].currentData = newData;
        return tables[id].currentData;
    }
    
    function tableOriginalData(id) {
        return tables[id].originalData;
    }
    
    function tableMeta(id) {
        return tables[id].meta;
    }
    
    function columnMeta(tableId, colIdx) {
        return tables[tableId].meta[colIdx];
    }
    
    function columnType(tableId, colIdx) {
        return tables[tableId].meta[colIdx].type;
    }
    
    function tableRow(tableId, id) {
        existy(tables[tableId]) || error("No table under '"+tableId+"' key.");
        var row = _.find(tableOriginalData(tableId), function(row) {
            return rowId(row) == id;
        });
        existy(row) || error("No table row in table with '"+tableId+"' id under '"+id+"' id.");
        return row;
    }
    
    function rowId(row) {
        return row.id;
    }
    
    function rowData(row) {
        return row.data;
    }
    
    function rowDatum(row, colIdx) {
        return row.data[colIdx];
    }
    
    function tableFilterValue(tableId, colIdx, type, subtype) {
        var f = tables[tableId].filters;
        if (subtype) {
            if (existy(f[colIdx][type].value[subtype])) {
                return f[colIdx][type].value[subtype];
            }
            else {
                return void 0;
            }
        }
        else {
            return f[colIdx][type].value;
        }
    }
    
    function typeIsNumeric(type) {
        return _.indexOf(["numeric", "integer"], type) > -1;
    }
    
    function tableColIdxIsCustom(colIdx) {
        return colIdx === tableCustomColIdx();
    }
    
    function tableCustomColIdx() {
        return "__custom";
    }
    
    /**
     * 
     * @param {String} tableId
     * @param {String|Integer} colIdx
     * @param {String} type
     * @returns {Boolean} "true" if value DOES NOT pass test
     */
    function createFilteringComparator(tableId, colIdx, type) {
        if (tableColIdxIsCustom(colIdx)) {
            return function(value) {
                var filterValue = tableFilterValue(tableId, colIdx, type);
                // if our custom filter depends on existence of value in an array
                if (_.isArray(filterValue)) return filterValue.indexOf(value) === -1;
                else return false;
            }
        }
        else if (typeIsNumeric(type))
            return function(value) {
                var rowValue = parseFloat(handleInfinity(value)),
                    minValue = parseFloat(tableFilterValue(tableId, colIdx, type, "min")),
                    maxValue = parseFloat(tableFilterValue(tableId, colIdx, type, "max")),
                    res = false;
                
                res = existy(minValue) && ! isNaN(minValue) ? rowValue < minValue : false;
                return res || (existy(maxValue) && ! isNaN(maxValue) ? rowValue > maxValue : false);
            }
        else 
            return function(value) {
                var rowValue = String(value).toLowerCase(),
                        filterValue = tableFilterValue(tableId, colIdx, type);
                return existy(filterValue) && rowValue.indexOf(String(filterValue).toLowerCase()) === -1;
            }
    }
    
    function rowDatumIsFiltered(tableId, value, colIdx, type) {
        var f = tables[tableId].filters;
        if (existy(f[colIdx])) {
            if (tableColIdxIsCustom(colIdx)) {// do not iterate over all custom filters
                ! existy(type) && error("Custom filter should be provided with type over which to check values.");
                return f[colIdx][type].comparator(value);
            }
            else {
                return _.some(f[colIdx], function(typeObj) {
                    return typeObj.comparator(value);
                });
            }
        }
        else {
            return false;
        }
    }
    
    function rowIsFiltered(tableId, row) {
        var partial = _.partial(rowDatumIsFiltered, tableId);
        return partial(rowId(row), tableCustomColIdx(), "id") // either row id is explicitly filtered
                // or any of row data fields doesn't pass filter test
                || _.some(rowData(row), partial);
    }
    
    function tableAddFilter(tableId, value, colIdx, type, subtype) {
        var f = tables[tableId].filters;        
        if (!existy(f[colIdx])) f[colIdx] = {};
        if (!existy(f[colIdx][type])) {
            f[colIdx][type] = {
                comparator: createFilteringComparator(tableId, colIdx, type),
                value:      null
            };
        }
        
        if (! subtype) 
            f[colIdx][type].value = value;
        else {
            if (! _.isObject(f[colIdx][type].value)) 
                f[colIdx][type].value = {};
            f[colIdx][type].value[subtype] = value;
        }
    }
    
//    function tableRemoveFilter(tableId, colIdx, type, subtype) {
//        var f = tables[tableId].filters;
//        if (existy(f[colIdx])) {
//            if (existy(f[colIdx][type])) {
//                if (existy(f[colIdx][type].value[subtype])) {
//                    delete f[colIdx][type].value[subtype];
//                }
//                if (! _.size(f[colIdx][type].value)) delete f[colIdx][type];
//            }
//            if (! _.size(f[colIdx])) delete f[colIdx];
//        }
//    }
    
    /**
     * 
     * @param {String} tableId
     * @returns {undefined}
     */
    function tableReapplyFilters(tableId) {
        var filteredData = _.filter(tableOriginalData(tableId), function(row) {
            return ! rowIsFiltered(tableId, row);
        });
        tableCurrentData(tableId, filteredData);
    }
    
    function tableFilter(tableId, value, colIdx, type, subtype) {
        tableAddFilter(tableId, value, colIdx, type, subtype);
        tableReapplyFilters(tableId);
    }
    
    function tableFilterByIds(tableId, rowIds) {
        tableAddFilter(tableId, rowIds, tableCustomColIdx(), "id");
        tableReapplyFilters(tableId);
    }
    
    function tablePerChunk(id, newPerChunk) {
        if (newPerChunk) tables[id].perChunk = newPerChunk;
        return tables[id].perChunk;
    }
    
    function handleInfinity(value) {
        return (value === "Inf" ? Number.MAX_VALUE : (value === "-Inf" ? -Number.MAX_VALUE : value));
    }
    
    function handleLinkTag(html) {
        var linkRegex, result;
        linkRegex = /<a[^>]*>(.*?)<\/a>/;
        // html may be just a Number, Boolean, null so test for this function first
        result = _.isFunction(html.match) && html.match(linkRegex);
        return _.isArray(result) && _.size(result) > 1 ? result[1] : html;
    }
    
    function tableColumnSummary(tableId, colIdx) {
        
        var countNumeric = function(tableId, colIdx) {
            var summary = [], summaryNA = 0;
            _.each(tableCurrentData(tableId), function(row) {
                var rowValue = rowDatum(row, colIdx);
                if (rowValue == "NA") 
                    summaryNA++;
                else 
                    summary.push(parseFloat(handleInfinity(rowValue)));
            });

            return {
                summary:    summary,
                summaryNA:  summaryNA
            };
        }
        
        var countDefault = function(tableId, colIdx) {
            var summary = [];
            _.each(tableCurrentData(tableId), function(row) {
                var rowValue = rowDatum(row, colIdx), summaryEntry;
                summaryEntry = _.find(summary, function(entry) {
                    return entry.value == rowValue;
                });
                if (summaryEntry)
                    summaryEntry.count++;
                else
                    summary.push({
                        value:  rowValue,
                        count:  1
                    });
            });
            return summary;
        }
        
        var sortNumeric = function(summaryObj) {
            summaryObj.summary.sort(function(a, b) {
                // ascending order
                if (a > b) return 1;
                else if (a < b) return -1;
                else return 0;
            });
            return summaryObj;
        }
        
        var sortDefault = function(summary) {
            return summary.sort(function(a, b) {
                // descending order
                if (a.count > b.count) return -1;
                else if (a.count < b.count) return 1;
                else return 0;
            });
        }
        
        var outputNumeric = function(summaryObj) {
            var median = 0,
                half = Math.floor(summaryObj.summary.length/2);
            if(summaryObj.summary.length % 2)
                median = summaryObj.summary[half];
            else
                median = (summaryObj.summary[half-1] + summaryObj.summary[half]) / 2.0;

            var sum = _.reduce(summaryObj.summary, function(sum, num) {
                return sum + (isNaN(num) ? 0 : num);
            }, 0);

            return {
                "Min.":     summaryObj.summary[0],
                "Median":   median.toFixed(3),
                "Mean":     (sum / summaryObj.summary.length).toFixed(3),
                "Max.":     _.last(summaryObj.summary),
                "NA":       summaryObj.summaryNA
            };
            
        }
        
        var outputDefault = function(summary) {
            var outputSummary = {};
            for (var i = 0, l = summary.length < 6 ? summary.length : 6; i < l; i++) {
                outputSummary[summary[i].value] = summary[i].count;
            }
            if (summary.length > 6) {
                outputSummary["(Other)"] = summary.length-6;
            }
            return outputSummary;
        }
        
        
        
        var numeric = function(tableId, colIdx, type) {
            if (type == "numeric") {
                return outputNumeric(sortNumeric(countNumeric(tableId, colIdx)));
            }
            else
                return false;
        }
        
        var character = function(tableId, colIdx) {
            return outputDefault(sortDefault(countDefault(tableId, colIdx)));
        }
        
        var summary;
        _.some([numeric, character], function(counter) {
            summary = counter(tableId, colIdx, columnType(tableId, colIdx));
            return summary;
        });
        
        return summary;
        
    }
    
    function tableChunk(tableId, chunkNo, perChunk) {
        perChunk = tablePerChunk(tableId, perChunk);
        var lowerBound = chunkNo*perChunk, nbCollected = 0;

        return _.filter(tableCurrentData(tableId), function(row, i) {
            return i >= lowerBound && nbCollected++ < perChunk;
        });
    }
    
    function tableActive(tableId) {
        return _.map(tableCurrentData(tableId), function(row) {
            return rowId(row);
        });
    }
    
    function tableSort(id, colIdx, order) {
        function doSort(row1, row2) {
            var v1 = row1.data[colIdx],
                v2 = row2.data[colIdx];

            v1 = handleLinkTag(v1);
            v2 = handleLinkTag(v2);

            v1 = handleInfinity(v1);
            v2 = handleInfinity(v2);

            var isNumeric = ! isNaN(parseFloat(v1)) && parseFloat(v1) == v1;
            if (isNumeric) {
                v1 = parseFloat(v1);
                v2 = parseFloat(v2);
            }
            if (order === "asc") {
                if (v1 < v2) {
                    return -1;
                }
                else if (v1 > v2) {
                    return 1;
                }
                else return 0;
            }
            else {
                if (v1 < v2) {
                    return 1;
                }
                else if (v1 > v2) {
                    return -1;
                }
                else return 0;
            }
        }
        // take care of both original and current data
        // if sorting and some filter are applied and user resigns of filtering
        // then
        tableCurrentData(id).sort(doSort);
        tableOriginalData(id).sort(doSort);
    }
    
    
    
    
    return {
        init:   function(msgData) {

            function prepareData(data) {
                return _.map(data, function(row, id) {
                    return {
                        id:         id,
                        data:       _.map(row, _.identity)
                    };
                });
            }
            
            function prepareMeta(meta) {
                return _.map(meta, _.identity);
            }
            
            precheck(msgData);
            check(msgData, ["meta", "data", "perChunk"]);
            var table = _.extend(_.pick(msgData, ["meta", "perChunk"]), {
                summaryCache:   {},
                filters:        {}
            });
            table.meta = prepareMeta(table.meta);
            table.originalData = prepareData(msgData.data);
            table.currentData = _.clone(table.originalData);
            tables[msgData.id] = table;
            return msgData;
        },
                
        getDataChunk:   function(msgData) {
            precheck(msgData);
            check(msgData, ["chunkNo", "perChunk"]);
            var resp = _.clone(msgData);
            resp.chunk = tableChunk(msgData.id, msgData.chunkNo, msgData.perChunk);
            return _.pick(resp, ["id", "cmd", "chunk", "jobId"]);
        },
                
        terminate:  function(msgData) {
            precheck(msgData);
            delete tables[msgData.id];
            return _.pick(msgData, ["id", "cmd"]);
        },
                
        sort:   function(msgData) {
            precheck(msgData);
            check(msgData, ["colIdx", "order"]);
            var resp = _.clone(msgData);
            tableSort(msgData.id, msgData.colIdx, msgData.order);
            resp.chunk = tableChunk(msgData.id, 0, tablePerChunk(msgData.id));
            return _.pick(resp, ["id", "cmd", "chunk", "jobId"]);
        },
                
        filter: function(msgData) {
            precheck(msgData);
            check(msgData, ["colIdx", "type", "subtype", "value"]);
            var resp = _.clone(msgData);
            tableFilter.apply(self, _.values(_.pick(msgData, ["id", "value", "colIdx", "type", "subtype"])));
            _.extend(resp, {
                chunk:  tableChunk(msgData.id, 0, tablePerChunk(msgData.id)),
                rowIds: tableActive(msgData.id)
            });
            return _.pick(resp, ["id", "cmd", "chunk", "rowIds", "jobId"]);
        },
                
        filterByIds:    function(msgData) {
            precheck(msgData);
            check(msgData, ["rowIds"]);
            var resp = _.clone(msgData);
            tableFilterByIds.apply(self, _.values(_.pick(msgData, ["id", "rowIds"])));
            _.extend(resp, {
                chunk:  tableChunk(msgData.id, 0, tablePerChunk(msgData.id)),
                rowIds: tableActive(msgData.id) // re-calculate them here as rowIds in msgData may be null
            });
            return _.pick(resp, ["id", "cmd", "chunk", "rowIds", "jobId"]);
        },
                
        getActiveRows:  function(msgData) {
            precheck(msgData);
            var resp = _.clone(msgData);
            resp.rows = tableCurrentData(msgData.id);
            return _.pick(resp, ["id", "cmd", "jobId", "rows"]);
        },
                
        getRow: function(msgData) {
            precheck(msgData);
            var resp = _.clone(msgData);
            resp.row = tableRow(msgData.id, msgData.rowId);
            return _.pick(resp, ["id", "cmd", "jobId", "row"]);
        },
                
        getSummary: function(msgData) {
            precheck(msgData);
            check(msgData, ["id", "colIdx"]);
            var resp = _.clone(msgData);
            resp.summary = tableColumnSummary.apply(self, _.values(_.pick(msgData, ["id", "colIdx"])));
            return _.pick(resp, ["id", "cmd", "jobId", "summary"]);
        }
    };
    
})();


self.addEventListener("message", function(e) {
    self.postMessage(facade[e.data.cmd](e.data));
}, false);


/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Client from "client/Client";

/**
 * @constructor
 * @extends Client
 * @param {String} urlBase Root under which url is constructed
 */
function RClient(urlBase) {
    this.url_base = urlBase;
}

function Intermediate() {}
Intermediate.prototype = Client.prototype;

RClient.prototype = new Intermediate();
RClient.prototype.constructor = RClient;

/**
 * Encodes "+" chars
 * @overwritten
 * @param {Object} params
 * @returns {Object}
 */
RClient.prototype.encodeParams = function(params) {
    params = Client.prototype.encodeParams.call(this, params);
    _.each(params, function(value, key) {
        if (value instanceof File) return;
        params[key] = value.toString().replace(/\+/g, "%2B");
    });
    return params;
};

/**
 * Decorates params that should be sent in request body to R resource
 * @param {Object} params
 * @param {String} page
 * @param {Array[FileParameterModel]} files
 * @returns {Object}
 */
RClient.prototype.decoratePostParams = function(params, page, files) {
    params.page = page;
    _.each(params, function(value, key) {
        try {
            if (! (value instanceof File)) {// stringify only primitives
                params[key] = JSON.stringify(value);
            }
        }
        catch (e) {
            params[key] = "";
        }
    });

    params.device = (!! document.createElementNS &&
                        !! document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect ?
                        "svg" : "png");

    /*
     * Analysis server may make use of additional width & height params
     * for the purpose of rendering plot
     * here we also force server to return plot in format 4:3
     */
    var heightInches = parseInt(504 / 72);
    params.height = heightInches;
    params.width = parseInt(heightInches * 4 / 3);
    /*
     * @see EXPRESSIONPLOT-113
     */
    params.decoder = "url";

    // detect if browser supports file uploads through XHR2
    params.textarea_wrap = $("<input type='file'/>").get(0).files === undefined;

    params = this.encodeParams(params);

    var fd = new FormData();
    _.each(params, function(val, name) {
        fd.append(name, val);
    });
    /**
     * @see EXPRESSIONPLOT-415
     */
    _.each(files, function(fileModel) {
        fd.append(fileModel.getFileKey(), fileModel.getValue());
    });

    return fd;
};


export default RClient;

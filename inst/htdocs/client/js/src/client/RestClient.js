/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["client/Client"], function(Client) {
    
    /**
     * @constructor
     * @extends Client
     * @param {String} urlBase Root under which url is constructed
     * 
     */
    function RestClient(urlBase) {
        this.url_base = urlBase;
    }
    
    function Intermediate() {}
    Intermediate.prototype = Client.prototype;
    RestClient.prototype = new Intermediate();
    RestClient.prototype.constructor = RestClient;
    
    return RestClient;
});
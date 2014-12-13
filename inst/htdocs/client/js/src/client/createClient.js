/**
 * Client factory function
 */
define(["./RClient", "./RestClient", "config"], function(RClient, RestClient, config) {
    return function(type) {
        switch (type) {
            case "R":
                return new RClient(config["client.R.url"]);
            case "REST":
                return new RestClient(config["client.REST.url"]);
        }
    }
});
/**
 * Client factory function
 */
import RClient from "./RClient";
import RestClient from "./RestClient";
import config from "config";

export default function(type) {
    switch (type) {
        case "R":
            return new RClient(config["client.R.url"]);
        case "REST":
            return new RestClient(config["client.REST.url"]);
    }
}

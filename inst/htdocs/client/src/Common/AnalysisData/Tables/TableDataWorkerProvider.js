/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import _ from "underscore";
import Marionette from "marionette";
import app from "app";

export default Marionette.Object.extend({
    initialize: function() {
        this.jobs = {};
        this.worker = null;
        try {
            // enclose it in try/catch block because some browsers
            // do not allow initializing Workers in local env without
            // running web server
            this.worker = new Worker("src/workers/TableDataWorker.js");
            this.worker.addEventListener("message", this.onWorkerMessage.bind(this), false);
            this.worker.addEventListener("error", this.onWorkerError.bind(this), false);
            app.channel.reply("table-data:worker:register-job", this.registerJob, this);
        }
        catch (e) {
            setTimeout(() => app.channel.trigger("table-data:worker:security-error"), 100);
            // throw e;
        }
    },

    onDestroy: function() {
        app.channel.stopReplying("table-data:worker:register-job");
    },

    registerJob: function(workerArgs, callback) {
        let jobId = _.uniqueId();
        callback && (this.jobs[jobId] = callback);
        workerArgs.jobId = jobId;
        this.worker.postMessage(workerArgs);
    },

    fireCallback: function(data) {
        if (typeof this.jobs[data.jobId] !== "undefined") {
            this.jobs[data.jobId].call(null, null, _.omit(data, ["jobId", "cmd", "id"]));
            delete this.jobs[data.jobId];
        }
    },

    onWorkerMessage: function(e) {
        switch (e.data.cmd) {
            case "init":
                break;
            default:
                this.fireCallback(e.data);
        }

    },

    onWorkerError: function(e) {

    }

});

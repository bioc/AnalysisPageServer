/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(function(require) {
    describe("# config", function() {
        before(function() {
            this.config = require("config");
        });
        it("has specific keys", function() {
            expect(this.config).to.have.keys([
                "parameter.collection.url",
                "page.collection.url",
                "client.R.url", 
                "client.REST.url", 
                "app.model.localStorage",
                "page.model.localStorage",
                "history.root"]);
        });
    });
});
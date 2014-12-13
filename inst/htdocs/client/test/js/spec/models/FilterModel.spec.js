/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(function(require) {
    
    describe("# FilterModel", function() {
        
        var FilterModel = require("models/FilterModel");
        
        it("Result of 'toReadableFormat()' is a String", function() {
            var model = new FilterModel();
            expect(model.toReadableFormat()).to.be.a("String");
        });
        
    });
    
});
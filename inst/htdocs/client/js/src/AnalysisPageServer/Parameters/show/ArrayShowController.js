/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette"], 
function(Marionette) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("parameters:views:array:listen-to", this.listenToView, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        listenToView: function(arrayView) {
            var self = this;
            this.listenTo(arrayView, "click:add-btn", this._onClickAddBtn);
            this.listenTo(arrayView, "click:remove-btn", this._onClickRemoveBtn);
            arrayView.once("destroy", function() {
                self.stopListening(arrayView);
            });
        },
        _onClickAddBtn: function(args) {
            args.model.addChild();
        },
        _onClickRemoveBtn: function(args) {
            args.model.destroyLastChild();
        }
    });
});
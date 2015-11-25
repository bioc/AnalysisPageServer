/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "bacon"],
function(Marionette, Bacon) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:plot:initialize-point-details", this.initializePointDetails, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        /**
         *
         * @returns {undefined}
         */
        initializePointDetails: function(svgView, tableDataModel) {
            var self = this;
            svgView.once("destroy", function() {
                self.stopListening(svgView);
            });
            var innerMouseDowned = Bacon.fromEvent(svgView, "mouse:downed")
                    .toProperty(false);
            var mouseoverES =
                    svgView.$el.asEventStream("mouseover.epupdatedetails");
            // mouseover event stream for plot points
            var filteredMouseoverES =
                    mouseoverES
                    .filter(innerMouseDowned.not())
                    .filter(this, "_hasClass", svgView.getOption("regionClass"));
            filteredMouseoverES
                    .takeUntil(svgView.getDestroyES())
                    .map(".target.id")
                    .onValue(svgView, "triggerMethod", "emphasize:point");

            var mouseoutES =
                    svgView.$el.asEventStream("mouseout.epupdatedetails");
            // mouseout event stream for plot points
            var filteredMouseoutES =
                    mouseoutES
                    .filter(this, "_hasClass", svgView.getOption("regionClass"));
            // property that provides current hovered point ID
            var targetIdProp =
                    filteredMouseoverES.map(".target.id")
                    .merge(mouseoutES.map(null))
                    .toProperty(null);
            // with a small delay after hovering plot point
            // perform a details fetch
            var targetDetailsResponse =
                    filteredMouseoverES
                    .delay(200)
                    .flatMapLatest(this, "_mapToDetailsResponse", tableDataModel);

            var idsEqualProp = Bacon.combineWith(_.isEqual, targetIdProp,
                    targetDetailsResponse.map(".response.row.id"));

            var filteredDetailsResponse = targetDetailsResponse
                    .filter(idsEqualProp);

            filteredDetailsResponse
                    .takeUntil(svgView.getDestroyES())
                    .onValue(this, "renderPointDetails", svgView, tableDataModel);

            filteredMouseoutES
                    .takeUntil(svgView.getDestroyES())
                    .map(".target.id")
                    .onValue(svgView, "triggerMethod", "deemphasize:point");
            // mouseenter event stream for detail boxes
            var popoverMouseenterES = svgView.$el
                    .asEventStream("mouseenter.epupdatedetails", ".popover");
            // mouseleave event stream for detail boxes
            var popoverMouseleaveES = svgView.$el
                    .asEventStream("mouseleave.epupdatedetails", ".popover");;
            // used to find out if mouse cursor is over details box
            var mouseOverDetailsProp =
                    popoverMouseenterES.map(this, "_pointIdFromPopoverES")
                    .merge(popoverMouseleaveES.map(null))
                    .toProperty(null);
//            mouseOverDetailsProp.log("mouseOverDetailsProp");
            // map mouseleave events to current values of received details ID
            // and then hide details box
            popoverMouseleaveES
                    .map(this, "_pointIdFromPopoverES")
                    .takeUntil(svgView.getDestroyES())
                    .onValue(this, "hidePointDetails", svgView);

            var leftPointIdProp = filteredMouseoutES
                    .delay(500)
                    .map(".target.id")
                    .toProperty(null);
            var popoverIdEqualsPointIdProp = Bacon.combineWith(
                    _.bind(this._asIdOrFalse, this),
                    mouseOverDetailsProp,
                    leftPointIdProp);
            // on plot point mouseout, hide its details box only after specified delay
            // and if mouse cursor is not over details box
            popoverIdEqualsPointIdProp
                    .takeUntil(svgView.getDestroyES())
//                    .log("popoverIdEqualsPointIdProp")
                    .onValue(this, "hidePointDetails", svgView);
        },
        _asIdOrFalse: function(popoverId, leftPointId) {
            // if ids are equal then emit "false" so the listener won't hide details
            // of currently hovered popover
            // if ids aren't equal then emit id of point that was left so
            // listener knows what popover it should hide
            return leftPointId === popoverId ? false : leftPointId;
        },
        _pointIdFromPopoverES: function(e) {
            return $(e.currentTarget).attr("data-point-id");
        },
        _hasClass: function(clss, e) {
            var target = e.target;
            if (! (target.className && target.className.baseVal)) return false;
            var prop = target.className.baseVal;
            return prop && prop.indexOf && prop.indexOf(clss) > -1;
        },
        _mapToDetailsResponse: function(model, e) {
            return Bacon.combineTemplate({
                response: Bacon.fromNodeCallback(model, "getRow", e.target.id),
                pageX: e.pageX,
                pageY: e.pageY
            });
        },
        hidePointDetails: function(svgView, id) {
            if (! id) return;
            svgView.$el.children("[data-point-id="+id+"]").remove();
        },
        renderPointDetails: function(svgView, tableDataModel, result) {
            var self = this;
            var pointId = result.response.row.id;
            var labels = tableDataModel.metaCollection.pluck("label");
            // DONE EXPRESSIONPLOT-316 - point details not populating correctly
            var pairs = _.map(result.response.row.data, function(datum, i) {
                return {label: labels[i], value: ""+datum};// prevent zeros from not displaying
            });
            var listTmpl = Marionette.TemplateCache.get("#ep-dl-tmpl");
            var listHtml = listTmpl({items: pairs, horizontal: true});
            var $tip = this._insertStructure(svgView, listHtml);
            // take into account relative parent
            // important to keep these popovers in svgView so they are visible in fullscreen
            var svgOffset = svgView.$el.offset();
            // also check if we scrolled window a bit
            $tip.offset({
                top: $(window).scrollTop() + result.pageY - svgOffset.top,
                left: $(window).scrollLeft() + result.pageX - svgOffset.left+5
            });
            $tip.attr("data-point-id", pointId);
            $tip.find(".close").attr("data-point-id", pointId);
            $tip.one("click", ".close", function(e) {
                self.hidePointDetails(svgView, pointId);
            });
            $tip.show();
        },
        _insertStructure: function(svgView, content) {
            svgView.$el.children(".popover").remove();
            var detailsTmpl = Marionette.TemplateCache.get("#ep-popover");
            var $detailsHtml = $(detailsTmpl({
                arrow: false,
                close: true,
                title: "Details",
                content: content
            }));
            svgView.$el.append($detailsHtml);
            return $detailsHtml;
        }
    });
});

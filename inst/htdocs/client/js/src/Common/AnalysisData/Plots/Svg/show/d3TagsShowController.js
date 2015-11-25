/* 
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
define(["marionette", "d3", "d3.bacon"], 
function(Marionette, d3, d3asEventStream) {
    return Marionette.Controller.extend({
        initialize: function() {
            this.getCommands().setHandler("analysis-data:views:plot:d3:render-tags", this.renderTags, this);
        },
        getCommands: function() {
            return Backbone.Wreqr.radio.channel("global").commands;
        },
        getReqRes: function() {
            return Backbone.Wreqr.radio.channel("global").reqres;
        },
        renderTags: function(svgView, tableDataModel, isRepaint) {
            var newlySelected = isRepaint ? tableDataModel.get("selected") : tableDataModel.get("newlySelected");

            if (_.size(newlySelected) === 0) return;
            
            var self = this;
            tableDataModel.getActiveRows().then(function(result) {
                var subsetOfRows = self.filterSelected(newlySelected, result);
                var data = self.prepareDataForD3NodesLinks(svgView, subsetOfRows);
                var force = self.prepareForce(svgView, data);
                self.renderNodesLinks(svgView, data, force);
                svgView.model.set("tagCloudVisible", true);
                svgView.trigger("plot:tagging:done");
            });
        },
        renderNodesLinks: function(svgView, nodesLinks, force) {
            var cloud = svgView.d3.surface.append("g")
                    .attr("class", "ep-tag-cloud");
            var link = cloud.selectAll(".ep-tag-link")
                .data(nodesLinks.links)
                .enter().append("line")
                .attr("class", "ep-tag-link")
                // get computed "stroke" value so canvg.js can parse inline style
                .style("stroke", function() { return d3.select(this).style("stroke"); });

            var drag = force.drag()
                    .on("dragstart", function(d) {
                        d.fixed = true;
                    });

            var node = cloud.selectAll(".ep-tag")
                .data(nodesLinks.nodes)
                .enter().append("g")
                .attr("class", "ep-tag")
                .call(drag);
            // stop propagation of mousedown event on tags while dragging
            d3asEventStream(node, "mousedown.eppreventpanning")
                .takeUntil(svgView.getDestroyES())
                .onValue(".stopPropagation");

            node.append("text")
                .attr("dy", ".35em")
                .text(function(d) { return d.tagLabel; });

            force.on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            })
            .on("end", function() {
                node.datum(function(d) { d.fixed = true; return d; });
            });
        },
        prepareForce: function(svgView, nodesLinks) {
            var force = d3.layout.force();            
            force
                .nodes(nodesLinks.nodes)
                .links(nodesLinks.links)
                .size([svgView.width, svgView.height])
                .friction(0.7)
                .gravity(0.05)
                .charge(-20)
                .start();

            return force;
        },
        prepareDataForD3NodesLinks: function(svgView, rows) {
            var nodes = [], tempElement = document.createElement("div"), 
                    dataFieldIdx = svgView.model.get("tagFieldIdx"),
                    svgPoint = null, svgPointX, svgPointY, idx = 0, rowPointIdx = 0, links = [];

            _.each(rows, function(row, i) {
                svgPoint = svgView.d3.points.filter("#"+row.id);
                svgPointX = svgPoint.datum().startingPoint[0];
                svgPointY = svgPoint.datum().startingPoint[1];
                rowPointIdx = idx;
                nodes.push({
                    x:      svgPointX,
                    y:      svgPointY,
                    fixed:  true,
                    index:  rowPointIdx
                });
                nodes.push({
                    index:      ++idx,
                    x:          _.random(svgPointX-20, svgPointX+20),
                    y:          _.random(svgPointY-20, svgPointY+20),
                    // get rid of possible HTML stuff like <a></a>
                    tagLabel:   $(tempElement).html(String(row.data[dataFieldIdx])).text()
                });
                links.push({
                    source: rowPointIdx,
                    target: idx
                });

                idx++;
            });

            return {
                nodes:  nodes,
                links:  links
            };
        },
        filterSelected: function(newlySelected, result) {
            return _.filter(result.rows, function(row) {
                return newlySelected && _.indexOf(newlySelected, row.id) > -1;
            });
        }
    });
});
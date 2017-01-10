/*
 * Copyright Genentech - A member of the Roche Group
 * @author Adrian Nowicki <adrian.nowicki@contractors.roche.com>
 */
import $ from "jquery";
import _ from "underscore";
import Marionette from "marionette";
import d3 from "d3";
import d3asEventStream from "d3.bacon";
import app from "app";

export default Marionette.Controller.extend({
    initialize() {
        app.channel.reply("analysis-data:views:plot:d3:render-tags", this.renderTags, this);
    },
    onDestroy() {
        app.channel.stopReplying("analysis-data:views:plot:d3:render-tags");
    },
    renderTags(svgView, tableDataModel, isRepaint) {
        var newlySelected = isRepaint ? tableDataModel.get("selected") : tableDataModel.get("newlySelected");

        if (_.size(newlySelected) === 0) return;

        tableDataModel.getActiveRows().then(result => {
            var subsetOfRows = this.filterSelected(newlySelected, result);
            var data = this.prepareDataForD3NodesLinks(svgView, subsetOfRows);
            var force = this.prepareForce(svgView, data);
            this.renderNodesLinks(svgView, data, force);
            svgView.model.set("tagCloudVisible", true);
            svgView.trigger("plot:tagging:done");
        });
    },
    renderNodesLinks(svgView, nodesLinks, force) {
        var cloud = svgView.d3.surface.append("g")
                .attr("class", "ep-tag-cloud");
        var link = cloud.selectAll(".ep-tag-link")
            .data(nodesLinks.links)
            .enter().append("line")
            .attr("class", "ep-tag-link")
            // get computed "stroke" value so canvg.js can parse inline style
            .style("stroke", function() { return d3.select(this).style("stroke"); });

        var drag = force.drag()
                .on("dragstart", d => d.fixed = true);

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
            .text(d => d.tagLabel);

        force.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
        })
        .on("end", () => {
            node.datum(function(d) { d.fixed = true; return d; });
        });
    },
    prepareForce(svgView, nodesLinks) {
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
    prepareDataForD3NodesLinks(svgView, rows) {
        var nodes = [], tempElement = document.createElement("div"),
                dataFieldIdx = svgView.model.get("tagFieldIdx"),
                svgPoint = null, svgPointX, svgPointY, idx = 0, rowPointIdx = 0, links = [];

        _.each(rows, (row, i) => {
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
    filterSelected(newlySelected, result) {
        return _.filter(result.rows, row =>
            newlySelected && _.indexOf(newlySelected, row.id) > -1);
    }
});

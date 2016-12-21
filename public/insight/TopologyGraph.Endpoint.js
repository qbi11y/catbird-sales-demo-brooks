Catbird.Insight.TopologyGraph.EndpointCls = function(graph) {
    var Endpoint = {
        initialize: function() {
            graph.topologyEndpointPie = d3.layout.pie()
                .startAngle(graph.horizonAngle)
                .endAngle(tau - graph.horizonAngle)
                .padAngle(graph.sizes.piePadding)
                .sort(null)
                .value(Endpoint.pieValue);

            graph.remoteEndpointPie = d3.layout.pie()
                .startAngle(-graph.horizonAngle)
                .endAngle(graph.horizonAngle)
                .padAngle(graph.sizes.piePadding)
                .sort(null)
                .value(Endpoint.pieValue);

            graph.endpointHoverArc = d3.svg.arc();
            graph.endpointArc = d3.svg.arc();
            graph.endpointLabelArc = d3.svg.arc();
            graph.endpointChildHoverArc = d3.svg.arc();
            graph.endpointChildArc = d3.svg.arc();

            Endpoint.arcColorPickers = {};
            for(var endpointType in graph.colors.endpoint) {
                Endpoint.arcColorPickers[endpointType] = graph.colorPicker(graph.colors.endpoint[endpointType]);
            }
            Endpoint.arcChildColorPickers = {};
        },

        resize: function(sizes) {
            graph.endpointHoverArc
                .innerRadius(sizes.outerRingRadius)
                .outerRadius(sizes.outerChartRadius + graph.chartMargins.outer + graph.sizes.endpointLabelMargin);

            graph.endpointArc
                .innerRadius(sizes.outerRingRadius)
                .outerRadius(function(d) {
                    if(d.isExpanded) {
                        return sizes.outerRingRadius + graph.sizes.endpointExpandedParentDepth;
                    }
                    return sizes.outerChartRadius;
                });


            graph.endpointLabelArc
                .innerRadius(sizes.outerChartRadius + graph.sizes.endpointLabelMargin)
                .outerRadius(sizes.outerChartRadius + graph.sizes.endpointLabelMargin);

            var childRadius = sizes.outerRingRadius + graph.sizes.endpointExpandedParentDepth + graph.sizes.endpointExpandedMargin;

            graph.endpointChildHoverArc
                .innerRadius(childRadius)
                .outerRadius(childRadius + graph.chartMargins.outer + graph.sizes.endpointLabelMargin);

            graph.endpointChildArc
                .innerRadius(childRadius)
                .outerRadius(childRadius + graph.sizes.endpointExpandedChildDepth);
        },

        fullName: function(d) {
            if(d.type == "ip") {
                return d.name;
            }
            return graph.displayNames.endpoint[d.type] + ": " + d.name;
        },

        arcFill: function(d, i) {
            var colorPicker = Endpoint.arcColorPickers[d.type];
            return colorPicker(d.id);
        },

        childArcFill: function(d) {
            if(!(d.id in Endpoint.arcChildColorPickers)) {
                Endpoint.arcChildColorPickers[d.id] = graph.colorPicker(graph.colors.endpoint[d.type]);
            }
            var colorPicker = Endpoint.arcChildColorPickers[d.id];
            return function(c) {
                var color = d3.hsl(colorPicker(c.id));
                return d3.hsl(color.h, color.s * 0.95, color.l * 1.1);
            }
        },

        arcStroke: function(d, i) {
            var colorPicker = Endpoint.arcColorPickers[d.type];
            return d3.rgb(colorPicker(d.id)).darker(1);
        },

        childArcStroke: function(d, i) {
            var colorPicker = Endpoint.childArcFill(d);
            return function(c) {
                return d3.rgb(colorPicker(c.id)).darker(1);
            }
        },

        pieValue: function(d) {
            if(d.isExpanded && d.expandedIDs.length > 1) {
                var x = d.expandedIDs.length;
                return (10 * x) / (10 + x);
            }
            return 1;
        },

        updateLabel: function(d) {
            var centerAngle = ((d.startAngle + d.endAngle) / 2);

            var fontSize = 12;
            /*
                Try to fit the text into the available space.
                First try to shrink the font size slightly to fit it along the arc,
                then if that doesn't work, rotate it out to be perpendicular and set the font size based off text length.

                Note that our width comparisons are against different values than the font *height*, because fonts aren't monospace.
                These values are guesses that seem to work pretty well. (calculating a proper text string width is somewhat expensive)
            */
            var arcSpace = (Math.abs(d.startAngle - d.endAngle) * graph.endpointLabelArc.innerRadius()());
            var textLength = d.name.length;
            var rotated = false;
            if(arcSpace < (textLength * 10)) {
                if(arcSpace > (textLength * 9)) {
                    fontSize = 11;
                }
                else if(arcSpace > (textLength * 7)) {
                    fontSize = 10;
                }
                else {
                    centerAngle += (tau / 4);
                    rotated = true;

                    if(textLength > 10) {
                        fontSize = 11;
                    }
                    if(textLength > 15) {
                        fontSize = 10;
                    }
                }
            }

            var textAngle = graph.degreeScale(graph.normalizeAngle(centerAngle));

            var textAnchor = "end";
            // Flip text that would be upside-down
            if(textAngle > 90 && textAngle < 180) {
                textAnchor = "start";
                textAngle += 180;
            }
            else if(textAngle >= 180 && textAngle < 270) {
                textAnchor = "start";
                textAngle -= 180;
            }

            if(!rotated) {
                textAnchor = "middle";
            }

            d3.select(this).attr({
                "visibility": (d.isExpanded ? "hidden" : "visible"),
                "transform": "translate(" + graph.endpointLabelArc.centroid(d) + "), rotate(" + textAngle + ")",
                "text-anchor": textAnchor
            }).style({
                "font-size": fontSize + "px"
            });
        },

        updateHorizonAngles: function() {
            graph.topologyEndpointPie
                .startAngle(graph.horizonAngle)
                .endAngle(tau - graph.horizonAngle);

            graph.remoteEndpointPie
                .startAngle(-graph.horizonAngle)
                .endAngle(graph.horizonAngle);

            Endpoint.update(0, true);
        },

        expandEndpoint: function(d) {
            Catbird.ss.Insight.expandTopologyNode(
                {
                    operation: (d.isExpanded ? "collapse": "expand"),
                    endpoint: {
                        "type": d.type,
                        "targetID": d.id
                    }
                }
            );
        },

        childName: function(d) {
            return d.name;
        },

        childEndpointTitle: function(d) {
            if(d.type == "ip") {
                return d.endpoint.name + ": ";
            }
            return graph.displayNames.endpoint[d.endpoint.type] + " " + d.endpoint.name + ": " + d.name;
        },

        updateExpansionChildren: function(d) {
            if(d.isExpanded) {
                var childPie = d3.layout.pie()
                    .startAngle(d.startAngle)
                    .endAngle(d.endAngle)
                    .padAngle(graph.sizes.pieChildPadding)
                    .sort(null)
                    .value(function(d) { return 1; });

                var pies = childPie(d.expandedIDs);
                for(var i = 0; i < pies.length; i++) {
                    var pie = pies[i];
                    pie.data.startAngle = pie.startAngle;
                    pie.data.endAngle = pie.endAngle;
                    pie.data.padAngle = pie.padAngle;
                    pie.data.flowAngles = Endpoint.calculateFlowAngles(pie.data);
                }

                var children = d3.select(this).selectAll(".expandedChild")
                    .data(d.expandedIDs, graph.getter('id'));

                // update existing children
                children.select(".childArc")
                    .attr("d", graph.endpointChildArc);

                children.select(".childHoverArc")
                    .attr("d", graph.endpointChildHoverArc);

                children.select(".childLabel")
                    .each(Endpoint.updateLabel);

                // create new children
                var newChild = children.enter()
                    .append("g")
                    .attr("class", function(c) { return "expandedChild expandedChild-" + c.id; });

                newChild.append("path")
                    .attr("class", "hoverArc childHoverArc")
                    .attr("d", graph.endpointChildHoverArc)
                    .style({
                        "fill": "white",
                    });

                newChild.append("path")
                    .attr("class", "arc childArc")
                    .attr("d", graph.endpointChildArc)
                    .style({
                        "stroke-width": 0,
                        "stroke": Endpoint.childArcStroke(d),
                        "fill": Endpoint.childArcFill(d)
                    });

                var newChildLabel = newChild.append("g")
                    .attr("class", "childLabel")
                    .each(Endpoint.updateLabel)
                    .append('text')
                        .text(Endpoint.childName);

                var title = newChild.append("title")
                    .attr("class", "endpointTitle")
                    .text(Endpoint.childEndpointTitle);

                newChild.on("mouseenter", graph.Selection.endpointChildMouseEnter)
                    .on("mouseleave", graph.Selection.endpointChildMouseLeave)
                    .on("click", graph.Selection.endpointChildClick);

                // remove old children
                children.exit()
                    .transition("exit")
                        .duration(graph.animationTime)
                        .style({
                            "opacity": 1e-6
                        })
                        .remove();

            }
            else {
                d3.select(this).selectAll(".expandedChild").remove();
            }
        },

        calculateFlowAngles: function(d) {
            // calculate the slice division for each flow line
            // even if the slice covers >120 degrees, flows will only use that subspan
            var centerAngle = (d.endAngle + d.startAngle) / 2;
            var angleRange = Math.min(tau/3, Math.abs(d.endAngle - d.startAngle));
            // from there, figure out how much space we have available per flow
            // if it's too much, we'll clamp it back down
            var flowArcLength = angleRange * graph.flowLineRadius;
            var perFlowArcLength = flowArcLength / d.totalCount;
            var paddedFlowSize = (graph.sizes.flowLineWidth + (graph.sizes.flowLineWidthMargin * 2));
            if(perFlowArcLength > paddedFlowSize) {
                perFlowArcLength = paddedFlowSize;
                angleRange = (paddedFlowSize * d.totalCount / graph.flowLineRadius);
            }
            // the flow arrangement is swapped for the bottom arc
            // to that there are less line crossings
            if(d.placement == "topology") {
                angleRange = -angleRange;
                perFlowArcLength = -perFlowArcLength;
            }

            // in order to render incoming flows together and outgoing flows together,
            // we keep count here in order to offset the outgoing ones.
            return {
                startAngle: centerAngle - (angleRange / 2),
                angleStep: perFlowArcLength / graph.flowLineRadius,
            };
        },

        update: function(animationTime, resize) {
            function updateEndpointPies(pieLayout, endpointData, endpointCls) {
                var pies = pieLayout(endpointData);

                // get the data-bound endpoint selection
                var endpoints = graph.center.selectAll("." + endpointCls);

                // there's a bit of a messy piece of timing here - our animation factory needs to have visibility to
                // both the old values and the new values for the endpoints it's going to impact.
                // therefore, before we scribble over those, we need to save versions of the old values for the animation
                // factory to be able to look at. we use the element itself for that.
                endpoints.each(
                    function(d) {
                        this._oldFlowAngles = d.flowAngles;
                        this._oldAngles = {
                            startAngle: d.startAngle,
                            endAngle: d.endAngle,
                            padAngle: d.padAngle,
                            isExpanded: d.isExpanded
                        };
                    }
                );

                endpoints = endpoints.data(endpointData, function(d) { return d.id; });

                endpoints.each(
                    function(d) {
                        if(this._oldFlowAngles) {
                            d._oldFlowAngles = this._oldFlowAngles;
                            d._oldAngles = this._oldAngles;
                            delete this._oldFlowAngles;
                            delete this._oldAngles;
                        };
                    }
                );

                // calculate the arrangement of the endpoints
                for(var i = 0; i < pies.length; i++) {
                    var pie = pies[i];
                    var data = pie.data;
                    // Save our newly calculated pie values to the object
                    // and recalculate the flow angles
                    data.startAngle = pie.startAngle;
                    data.endAngle = pie.endAngle;
                    data.padAngle = pie.padAngle;
                    data.flowAngles = Endpoint.calculateFlowAngles(data);
                }


                function updateEndpointPosition(d) {
                    // update the positioning of a endpoint
                    // because we want to slide the endpoint "radially", a simple tween will not do.
                    // additionally, we're updating the position of associated flows and labels at the same time.
                    if(!d._oldAngles) {
                        return null;
                    }

                    var oldAngles = d._oldAngles;
                    var oldFlowAngles = d._oldFlowAngles;
                    delete d._oldAngles;
                    delete d._oldFlowAngles;
                    if(
                        (oldAngles.startAngle == d.startAngle) &&
                        (oldAngles.endAngle == d.endAngle) &&
                        (oldAngles.padAngle == d.padAngle) &&
                        (oldAngles.isExpanded == d.isExpanded) &&
                        (resize !== true)
                    ) {
                        // the endpoint has already been positioned and does not need to be moved
                        // note that when we process a resize, we still need to reposition all endpoints
                        return null;
                    }

                    var d3This = d3.select(this);
                    var hoverArc = d3This.select("." + endpointCls + "HoverArc");
                    var arc = d3This.select("." + endpointCls + "Arc");
                    var label = d3This.select("." + endpointCls + "Label");

                    var newflowAngles = d.flowAngles;

                    var interpolators = {
                        startAngle: graph.interpolateAngle(oldAngles.startAngle, d.startAngle),
                        endAngle: graph.interpolateAngle(oldAngles.endAngle, d.endAngle),
                        padAngle: graph.interpolateAngle(oldAngles.padAngle, d.padAngle),
                        flowStartAngle: graph.interpolateAngle(oldFlowAngles.startAngle, newflowAngles.startAngle),
                        flowAngleStep: graph.interpolateAngle(oldFlowAngles.angleStep, newflowAngles.angleStep),
                    };

                    return function(i) {
                        // set all the values for this tick
                        d.startAngle = interpolators.startAngle(i);
                        d.endAngle = interpolators.endAngle(i);

                        if(d.startAngle > d.endAngle) {
                            // arc wedges want to be negative-to-positive when crossing the zero line, not normalized.
                            d.startAngle -= tau;
                        }
                        d.padAngle = interpolators.padAngle(i);
                        d.flowAngles = {
                            startAngle: interpolators.flowStartAngle(i),
                            angleStep: interpolators.flowAngleStep(i),
                        };
                        // and update the elements
                        hoverArc.attr("d", graph.endpointHoverArc);
                        arc.attr("d", graph.endpointArc);
                        label.each(Endpoint.updateLabel);
                        Endpoint.updateExpansionChildren.call(this, d);

                        graph.chart.selectAll(".flowHoverLine.flowLineSource-" + d.id + " path").attr("d", graph.Flow.draw);
                        graph.chart.selectAll(".flowHoverLine.flowLineDest-" + d.id + " path").attr("d", graph.Flow.draw);

                        graph.chart.selectAll(".flowLine.flowLineSource-" + d.id).each(graph.Flow.drawSegments);
                        graph.chart.selectAll(".flowLine.flowLineDest-" + d.id).each(graph.Flow.drawSegments);
                    }
                }

                // updating existing endpoints
                endpoints.each(Endpoint.updateExpansionChildren);

                endpoints.transition()
                        .duration(animationTime)
                        .tween("rearrange", updateEndpointPosition);

                endpoints.select(".endpointHoverArc title").text(Endpoint.fullName);
                endpoints.select(".endpointArc title").text(Endpoint.fullName);
                endpoints.select(".endpointLabel")
                    .text(graph.getter('name'))
                    .select("title")
                        .text(Endpoint.fullName);

                // creating new endpoints
                var newEndpoint = endpoints.enter()
                    .append("g")
                    .attr("class", "endpoint " + endpointCls);

                newEndpoint.append("path")
                    .attr("class", "endpointHoverArc " + endpointCls + "HoverArc")
                    .attr("d", graph.endpointHoverArc)
                    .style({
                        "z-index": "-1",
                        "fill": "white",
                    })
                    .append("title")
                        .text(Endpoint.fullName);

                newEndpoint.append("path")
                    .attr("class", "arc endpointArc " + endpointCls + "Arc")
                    .attr("d", graph.endpointArc)
                    .style({
                        "stroke-width": 0,
                        "stroke": Endpoint.arcStroke,
                        "fill": Endpoint.arcFill
                    })
                    .append("title")
                        .text(Endpoint.fullName);

                newEndpoint.append("text")
                    .attr("class", endpointCls + "Label endpointLabel")
                    .each(Endpoint.updateLabel)
                    .text(graph.getter('name'))
                    .append("title")
                        .text(Endpoint.fullName);

                newEndpoint.each(Endpoint.updateExpansionChildren);

                // add hover behavior
                newEndpoint.on("mouseenter", graph.Selection.endpointMouseEnter)
                    .on("mouseleave", graph.Selection.endpointMouseLeave)
                    .on("click", graph.Selection.endpointClick);

                newEndpoint.style("opacity", 1e-6)
                    .transition()
                        .duration(animationTime)
                        .style("opacity", 1);

                // removing existing endpoints
                var oldEndpoint = endpoints.exit()
                    .transition("exit")
                        .duration(animationTime)
                        .style("opacity", 1e-6)
                        .remove();

            }

            // build slices for the topology endpoints (bottom half)
            updateEndpointPies(graph.topologyEndpointPie, graph.data.topologyEndpoints, "topologyEndpoint");

            // very similar but slightly different for the remote notes (top half)
            updateEndpointPies(graph.remoteEndpointPie, graph.data.remoteEndpoints, "remoteEndpoint");
        }
    };
    return Endpoint;
};

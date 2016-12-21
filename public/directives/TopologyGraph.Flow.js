FlowCls = function(graph) {
    var Flow = {
        initialize: function() {
            graph.flowLine = d3.svg.line.radial()
                .interpolate('bundle')
                .tension(0.8)
                .radius(graph.getter('radius'))
                .angle(graph.getter('angle'));

            graph.flowHoverGroup = graph.center.append("g")
                .attr("class", "flowHoverGroup");

            graph.flowGroup = graph.center.append("g")
                .attr("class", "flowGroup");
        },

        resize: function(sizes) {
            graph.flowLineRadius = sizes.innerRingRadius - graph.sizes.flowLineDepthMargin;
        },

        fullName: function(d) {
            // need some corner case checking here
            return d.srcTarget + " : " + d.dstTarget;
        },

        getID: function(d) {
            return d.srcTarget + d.srcExpandedTarget + "-" + d.dstTarget + d.dstExpandedTarget + "-" + d.flowType;
        },

        angle: function(flow, direction) {
            var targetID = flow[direction + 'Target'];
            var targetEndpoint = graph.endpointMap[targetID];
            var expandedTarget = flow[direction + 'ExpandedTarget'];
            if(expandedTarget && targetEndpoint.expandedIDMap) {
                var child = targetEndpoint.expandedIDMap.get(expandedTarget);
                if(child) {
                    targetEndpoint = child;
                }
            }

            var flowAngles = targetEndpoint.flowAngles;
            var step = flow[direction + 'Index'];
            return flowAngles.startAngle + (flowAngles.angleStep * step);
        },

        endpointControlPoint: function(targetID) {
            var targetEndpoint = graph.endpointMap[targetID];
            var centerAngle = (targetEndpoint.endAngle + targetEndpoint.startAngle) / 2;
            return {radius: graph.flowLineRadius * 0.7, angle: centerAngle};
        },

        controlPoint: function(flow) {
            /*
                Add a control point to attempt to group flows together better.
                Outgoing flows aim for the "west" crossing, incoming the "east",
                and in-topology flows cross the "south" line.
            */
            var src = graph.endpointMap[flow.srcTarget];
            var dst = graph.endpointMap[flow.dstTarget];
            var srcCenter = (src.endAngle + src.startAngle) / 2;
            var dstCenter = (dst.endAngle + dst.startAngle) / 2;

            var radius = graph.flowLineRadius * 0.4;
            var angle = tau / 2;

            if(src.placement == "topology" && dst.placement == "remote") {
                angle = -tau / 6;
            }
            else if(src.placement == "remote" && dst.placement == "topology") {
                angle = tau / 6;
            }
            return {radius: radius, angle: angle};
        },

        draw: function(d) {
            var points = [];
            /*
                each flow line has several control points along it's curve:
                - the ends
                - a bundle for the center of the endpoint arc
                - a control point for the 'category' of the flow
            */
            points.push({radius: graph.flowLineRadius, angle: Flow.angle(d, 'src')});
            points.push(Flow.endpointControlPoint(d.srcTarget));
            points.push(Flow.controlPoint(d));
            points.push(Flow.endpointControlPoint(d.dstTarget));
            points.push({radius: graph.flowLineRadius, angle: Flow.angle(d, 'dst')});

            return graph.flowLine(points);
        },

        color: function(d) {
            if(!d.baseColor) {
                var baseColor = d3.hsl(graph.colors.flow[d.flowType]);
                var h = graph.normalizeAngle(baseColor.h + ((Math.random() - 0.5) * graph.colors.flowShimmerH), 360);
                var l = Math.max(0, Math.min(1, baseColor.l + ((Math.random() - 0.5) * graph.colors.flowShimmerL)));
                baseColor = d3.hsl(h, baseColor.s, l);
                d.baseColor = baseColor;
            }
            return d.baseColor;
        },

        markerColor: function(d) {
            return Flow.color(this.parentNode.__data__);
        },

        drawSegments: function(d) {

            // update the line
            var d3this = d3.select(this);
            var flowPath = d3this.select("path")
                .attr("d", Flow.draw(d));

            // update the direction arrow
            var pathElement = flowPath[0][0];

            d3this.selectAll("polygon")
                .attr({
                    transform: function(marker) {
                        var point, angle;
                        if(marker.target == "src") {
                            point = pathElement.getPointAtLength(0);
                            angle = graph.degreeScale(Flow.angle(d, 'src'));
                        }
                        else {
                            var length = pathElement.getTotalLength();
                            point = pathElement.getPointAtLength(length);
                            angle = graph.degreeScale(Flow.angle(d, 'dst'));
                        }
                        return "translate(" + point.x + ", " + point.y + ") rotate(" + angle + ")";
                    }
                });

            Flow.stopPulse.call(this);

        },

        startPulse: function(selection) {

            // run the pulser
            selection = selection.filter(function(d) {
                return d3.select(this).select(".flowPulseCircle").style("visibility") != "visible";
            });

            function pulseMarker() {
                // don't loop the pulse after the flow stopped being highlighted
                selection = selection.filter(function(d) {
                    var isActive = d3.select(this).classed("flowLine-active");
                    if(!isActive) {
                        Flow.stopPulse.call(this);
                    }
                    return isActive;
                });

                /*
                    this is structured so that we create one main pulse transition on the entire selection, and then
                    use transition.each() on the individual items. this keeps everything together, because it looks
                    really silly when flow lines start desyncing.
                */
                selection.transition("pulse")
                    .duration(graph.flowPulseAnimationTime)
                    .ease("linear")
                    .each("end", pulseMarker)
                    .each(function(d) {
                        var d3this = d3.select(this);

                        d3this.select(".flowPulseCircle")
                            .style({
                                "visibility": "visible"
                            })
                            .transition()
                            .tween("pulse", function(d) {
                                var flowPath = d3this.select("path");
                                var pathElement = flowPath[0][0];
                                var length = pathElement.getTotalLength();
                                var opacityScale = d3.scale.linear()
                                    .domain([0, 0.25, 0.75, 1])
                                    .range([1e-6, 1, 1, 1e-6]);

                                return function(i) {
                                    var p = pathElement.getPointAtLength((length * i)|0);
                                    d3.select(this)
                                        .attr({
                                            "cx": p.x,
                                            "cy": p.y,
                                            "opacity": opacityScale(i)
                                        });
                                };
                            });
                    });

            }
            pulseMarker();
        },

        stopPulse: function() {
            // stop any pulse animations if present
            var d3this = d3.select(this);

            d3this.interrupt("pulse")
                .transition("pulse");

            // hide the circle
            d3this.select(".flowPulseCircle")
                .style({
                    "visibility": "hidden"
                });
        },

        dashArray: function(d) {
            if(d.flowType in {'IPSFlow': true, 'ZACLDenyFlow': true}) {
                return "6, 3";
            }
            return "none";
        },

        title: function(d) {
            return graph.displayNames.flow[d.flowType] + ": " + graph.endpointMap[d.srcTarget].name + " \u2192 " +
                graph.endpointMap[d.dstTarget].name;
        },

        update: function(animationTime, resize) {

            var flowHover = graph.flowHoverGroup.selectAll(".flowHoverLine")
                .data(graph.data.flows, Flow.getID);

            var flows = graph.flowGroup.selectAll(".flowLine")
                .data(graph.data.flows, Flow.getID);

            /*
                selection update - A flow's targets will not change, and if the endpoint moves,
                the endpoint slide animation will handle updating the lines, so there's no repositioning to be done here.
                However, the endpoint's name could have changed.
            */
            flowHover.select("title").text(Flow.title);
            flows.select("title").text(Flow.title);

            /*
                selection enter - create new flow lines

                A flow line is actually represented by two sets of elements:
                    - The hover elements, which are lower in z-order than the lines, are used so the mouseover/mouseout regions aren't
                    frustratingly tiny. They're invisible, but bulkier than the lines themselves.
                    in order to put them "under" the real lines, though, we have to do two data-bindings on different classes. irritating.

                    - The flow lines themselves are comprised of multiple elements - the main line, plus the direction arrows and the pulse bauble.

            */
            var newFlowHover = flowHover.enter()
                .append("g")
                .attr("class", function(d) {
                    return "flowHoverLine flowLineType-" + d.flowType + " flowLineSource-" + d.srcTarget + " flowLineDest-" + d.dstTarget;
                });

            newFlowHover.append("path")
                .attr("class", "flowHoverPath")
                .attr("d", Flow.draw)
                .style({
                    "stroke-width": graph.sizes.flowLineHoverWidth,
                    "stroke": "#fff",
                    "fill": "none",
                    "opacity": 0
                });

            // add hover behavior
            newFlowHover.on("mouseenter", graph.Selection.flowMouseEnter)
                .on("mouseleave", graph.Selection.flowMouseLeave)
                .on("click", graph.Selection.flowClick);

            newFlowHover.append("title")
                .text(Flow.title);

            flowHover.exit()
                .remove();

            // now the real flow lines

            // start by creating the flow line-group
            var flowGroup = flows.enter()
                .append("g")
                .attr("class", function(d) {
                    return "flowLine flowLineType-" + d.flowType + " flowLineSource-" + d.srcTarget + " flowLineDest-" + d.dstTarget;
                })
                .style({
                    "stroke-width": 1,
                });

            // now add the line itself
            flowGroup.append("path")
                .attr("class", "flowPath")
                .style({
                    "stroke-width": graph.sizes.flowLineWidth,
                    "fill": "none",
                    "stroke": Flow.color,
                });

            flowGroup.selectAll("polygon")
                .data([
                    {
                        "target": "src",
                        "class": "flowStartMarker",
                        "points": "-2,-3 -1,1 1,1 2,-3"
                    },{
                        "target": "dst",
                        "class": "flowEndMarker",
                        "points": "-2,0 0,-4 2,0"
                    }
                ])
                .enter()
                    .append("polygon")
                    .attr({
                        "class": graph.getter("class"),
                        "points": graph.getter("points"),
                    })
                    .style({
                        "stroke-width": 1,
                        "fill": Flow.markerColor,
                        "stroke": Flow.markerColor
                    });

            flowGroup.append("circle")
                .attr({
                    "class": "flowPulseCircle",
                    "r": graph.sizes.flowLineWidth,
                })
                .style({
                    "visibility": "hidden",
                    "stroke-width": 1,
                    "fill": Flow.color,
                    "stroke": Flow.color
                });

            // now build the path segments
            flowGroup.each(Flow.drawSegments);

            // add interactivity behavior to the line-group
            flowGroup.append("title")
                .text(Flow.title);

            flowGroup.on("mouseenter", graph.Selection.flowMouseEnter)
                .on("mouseleave", graph.Selection.flowMouseLeave)
                .on("click", graph.Selection.flowClick);

            // animate the line-group in
            flowGroup.style({
                    "fill-opacity": 1e-6,
                    "stroke-opacity": 1e-6
                })
                .transition("fade")
                    .duration(animationTime)
                    .style({
                        "fill-opacity": 1,
                        "stroke-opacity": 1
                    });

            /*
                selection exit - fade out and remove old flow lines
            */
            flows.exit()
                .attr("class", "flowLine")
                .transition("exit")
                    .duration(animationTime)
                    .style({
                        "fill-opacity": 1e-6,
                        "stroke-opacity": 1e-6
                    })
                    .remove();

        }
    };
    return Flow;
};

Catbird.Insight.TopologyGraph.RingCls = function(graph) {
    var Ring = {
        initialize: function() {

            // create the outer ring
            graph.outerRingArc = d3.svg.arc()
                .startAngle(0)
                .endAngle(tau);

            graph.outerRingGroup = graph.center.append("g")
                .attr("class", "outerRingGroup");

            graph.outerRing = graph.outerRingGroup.append("path")
                .attr("class", "outerRing")
                .attr("fill", graph.colors.outerRing);

            graph.outerRing.style("opacity", 1e-6)
                .transition("initial-fade")
                    .duration(graph.initializeAnimationTime)
                    .style("opacity", 1);

            // create the segments to decorate the ring with for loading
            var ringSliceCount = 17;

            var ringSliceScale = d3.scale.linear()
                .domain([0, ringSliceCount + 1])
                .range([0, tau]);

            graph.ringSliceArc = d3.svg.arc()
                .startAngle(function(d) { return ringSliceScale(d[0]); })
                .endAngle(function(d) { return ringSliceScale(d[1]); });

            var ringData = d3.range(1, 1 + ringSliceCount * 2, 2)
                .map(function(d) {
                    return [d, d+1];
                });

            graph.outerRingSegments = graph.outerRingGroup.selectAll(".outerRingSegments")
                .data(ringData);


            graph.outerRingSegments.enter().append("path")
                .attr("class", "outerRingSegment")
                .attr("fill", graph.colors.outerRingSegment)
                .style({
                    "fill-opacity": 1e-6,
                });

            // create the filled-in section for graph-empty text
            graph.emptyRingFill = graph.center.append("g")
                .attr("class", "emptyRingFill")
                .style("visibility", "hidden");

            graph.emptyRingFill.append("circle")
                .attr("class", "fillCircle")
                .attr("fill", "#eee");

            graph.emptyRingFill.append("text")
                .attr({
                    "text-anchor": "middle",
                    "dy": ".35em"
                })
                .text("No Insight Topology has been defined yet");


            // create the filled-in section for topology creation progress
            graph.creationProgressGroup = graph.centerOverlay.append("g")
                .attr("class", "creationProgressGroup")
                .style({
                    "visibility": "hidden",
                    "fill-opacity": 0.8,
                });

            graph.creationProgressGroup.append("circle")
                .attr("class", "fillCircle")
                .attr("fill", "#bbb");

            graph.creationProgressGroup.append("text")
                .attr({
                    "text-anchor": "middle",
                    "dy": ".35em"
                })
                .text("Creating Topology...");

            // create the group for the horizon line
            graph.horizonAngle = tau/4;

            graph.horizonLine = d3.svg.line.radial()
                .angle(graph.getter('angle'));

            graph.horizonGroup = graph.center.append("g")
                .attr("class", "horizon")
                .style({
                    "visibility": "hidden",
                    "opacity": 1e-6
                });

            // create the wedges for shading the sides of the horizon
            graph.horizonWedgeArc = d3.svg.arc()
                .innerRadius(0);

            graph.horizonGroup.selectAll(".horizonWedge")
                .data(["Topology", "Remote"])
                .enter()
                    .append("path")
                    .attr("class", function(d) { return "horizonWedge horizonWedge-" + d; })
                    .style({
                        "fill": function(d) { return graph.colors["horizon" + d + "Fill"]; }
                    })
                    .on("click", graph.Selection.chartClick);

            graph.horizonGroup.select(".horizonWedge-Topology")
                .append("title")
                .text("Flows within the selected topology");

            graph.horizonGroup.select(".horizonWedge-Remote")
                .append("title")
                .text("Flows outside the selected topology");

            // create the horizon line itself
            graph.horizonGroup.append("path")
                .attr("class", "horizonLine")
                .style({
                    "stroke-width": graph.sizes.horizonLineWidth,
                    "stroke": graph.colors.horizonLine,
                    "fill": "none",
                });

            // this copy of the horizon line is only visible while dragging, but is always on top
            graph.centerOverlay.append("path")
                .attr("class", "horizonLine")
                .style({
                    "visibility": "hidden",
                    "stroke-width": graph.sizes.horizonLineWidth,
                    "stroke": graph.colors.horizonLine,
                    "fill": "none",
                    "z-index": 0
                });

            // create the little circles for dragging the horizon around
            graph.horizonDragGroup = graph.centerOverlay.append("g")
                .attr("class", "horizonDragPoints")
                .style("visibility", "hidden");

            graph.horizonDragGroup.selectAll(".horizonDragPoint")
                .data(["left", "right"])
                .enter()
                    .append("circle")
                    .attr({
                        "class": function(d) { return "horizonDragPoint horizonDragPoint-" + d; },
                        "r": graph.sizes.horizonLineWidth,
                        "stroke-width": 2,
                        "stroke": graph.colors.horizonLine,
                        "fill": graph.colors.horizonDragFill
                    })
                    .call(Ring.horizonDrag())
                    .append("title")
                        .text("Drag to resize topology");

            // create the connection state icons
            graph.connectionIconGroup = graph.chart.append("g")
                .attr({
                    "class": "connectionIconGroup",
                });

            graph.connectionStateIcon = graph.connectionIconGroup.append("svg:image")
                .attr({
                    "width": 16,
                    "height": 16
                })
                .style("visibility", "hidden");

            graph.connectionStateIcon.append("title");
        },

        resize: function(sizes) {
            graph.outerRingArc
                .innerRadius(sizes.innerRingRadius)
                .outerRadius(sizes.outerRingRadius);

            graph.ringSliceArc
                .innerRadius(sizes.innerRingRadius)
                .outerRadius(sizes.outerRingRadius);

            graph.horizonWedgeArc
                .outerRadius(sizes.innerRingRadius);

            graph.horizonLine
                .radius(function(d) {
                    if(d.center) {
                        return 0;
                    }
                    return sizes.outerRingRadius + graph.sizes.horizonExtension;
                });

            Ring.updateHorizon();

            graph.outerRing
                .attr("d", graph.outerRingArc);

            graph.outerRingSegments
                .attr("d", graph.ringSliceArc);

            graph.emptyRingFill.select(".fillCircle")
                .attr("r", sizes.innerRingRadius);

            graph.creationProgressGroup.select(".fillCircle")
                .attr("r", sizes.innerRingRadius);

            graph.connectionIconGroup.attr("transform", "translate(" + (graph.chartWidth - 16) + ", 0)")
        },

        setSocketConnected: function(connected, details) {
            if(!graph.connectionStateIcon) {
                return;
            }

            graph.connectionStateIcon.on('click', null);

            if(connected) {
                // show the connected icon and then fade it out
                graph.connectionStateIcon.attr({
                    "xlink:href": Catbird.appRoot + "icons/fam/connect.png",
                    "opacity": 1
                })
                .style({
                    "visibility": "visible",
                })
                .transition()
                    .ease("linear")
                    .duration(graph.animationTime)
                    .attr("opacity", 1e-6)
                    .each("end", function() {
                        graph.connectionStateIcon.style("visibility", "hidden");
                    });

                graph.connectionStateIcon.select("title").text("Connected");
            }
            else {
                // show the disconnected icon
                // if we're automatically reconnecting, pulse it until something happens, otherwise, leave it up
                graph.connectionStateIcon.attr({
                    "xlink:href": Catbird.appRoot + "icons/fam/disconnect.png",
                    "opacity": 1
                })
                .style({
                    "visibility": "visible",
                });

                if(details.disconnectMsg) {
                    graph.connectionStateIcon.select("title").text(details.disconnectMsg);
                }

                function pulse() {
                    graph.connectionStateIcon.transition()
                        .duration(graph.animationTime)
                        .ease("linear")
                        .attr("opacity", 0.5)
                        .transition()
                            .attr("opacity", 1)
                            .each("end", pulse);
                }

                if(details.reconnecting) {
                    pulse();
                }
                else {
                    graph.connectionStateIcon.on('click', function() {
                        graph.connectionStateIcon.on('click', null);
                        details.reconnectFn();
                        pulse();
                    });
                }
            }
        },

        setCreationProgress: function(data) {
            if(!graph.outerRingArc) {
                return;
            }
            graph.emptyRingFill.style("visibility", "hidden");
            graph.creationProgressGroup.style("visibility", "visible");
            graph.creationProgressGroup.select("text")
                .style("visibility", "visible");

            graph.creationProgressGroup.select(".fillCircle")
                .transition()
                    .duration(graph.animationTime)
                    .ease("linear")
                    .style({
                        "fill-opacity": (((100 - data.percentComplete) / 125.0) || 1e-6)
                    });

            Ring.setServerRefreshing(true);
        },

        setServerRefreshing: function(refreshing) {
            if(!graph.outerRingArc) {
                return;
            }

            Ring.showSegments(refreshing, graph.animationTime * 6);
        },

        setTopologyLoading: function(loading) {
            if(!graph.outerRingArc) {
                return;
            }

            Ring.showSegments(loading, graph.animationTime * 8);

            if(!loading) {
                graph.creationProgressGroup.select("text")
                    .style("visibility", "hidden");

                graph.creationProgressGroup.select(".fillCircle")
                    .transition()
                        .duration(graph.animationTime)
                        .style({
                            "fill-opacity": 1e-6
                        })
                        .each("end", function() {
                            graph.creationProgressGroup.style("visibility", "hidden");
                        });
            }
        },

        showSegments: function(show, speed) {
            if(show) {
                graph.outerRingSegments
                    .transition("loading-fade")
                    .duration(graph.animationTime)
                    .style("fill-opacity", 1);

                (function repeat() {
                    graph.outerRingGroup.attr("transform", "rotate(0)")
                        .transition("loading-spin")
                        .duration(speed)
                        .ease("linear")
                        .attrTween("transform", function() {
                            return d3.interpolateString("rotate(0)", "rotate(360)");
                        })
                        .each("end", repeat);
              })();
            }
            else {
                // fade the elements out and then stop the rotation timer
                graph.outerRingSegments
                    .interrupt("loading-fade")
                    .transition("loading-fade")
                        .duration(graph.animationTime)
                        .ease("linear")
                        .style("fill-opacity", 1e-6)
                        .each("end", function() {
                            // cancel the transition (whether it's running or pending, you have to do both)
                            graph.outerRingGroup
                                .attr("transform", "rotate(0)")
                                .interrupt("loading-spin")
                                .transition("loading-spin");
                        });
            }
        },

        horizonDrag: function() {
            return d3.behavior.drag()
                .on('dragstart', function() {
                    graph.horizonDragGroup.selectAll(".horizonDragPoint").attr('fill', graph.colors.horizonDragActiveFill);
                    graph.centerOverlay.select(".dragHoverOverlay").style("visibility", "visible");
                    graph.centerOverlay.select(".horizonLine").style("visibility", "visible");
                })
                .on('drag', function() {
                    /*
                        calculate the angle of the drag coordinate
                        note that the Y axis is inverted, and we want to use only the positive X value
                    */
                    var angle = Math.atan2(Math.abs(d3.event.x), -d3.event.y);

                    // snap when near a straight line
                    if(angle > tau * 0.245 && angle < tau * 0.255) {
                        angle = tau * 0.25;
                    }

                    // clamp the range to between 1/4 and 3/4 portions
                    var theta = Math.min(tau * 3 / 8,
                        Math.max(tau / 8,
                            graph.normalizeAngle(angle)
                        )
                    );

                    graph.horizonAngle = theta;
                    Ring.updateHorizon();
                })
                .on('dragend', function() {
                    graph.horizonDragGroup.selectAll(".horizonDragPoint").attr('fill', graph.colors.horizonDragFill);
                    graph.centerOverlay.select(".horizonLine").style("visibility", "hidden");
                    graph.centerOverlay.select(".dragHoverOverlay").style("visibility", "hidden");
                    graph.Endpoint.updateHorizonAngles();
                });
        },

        drawHorizon: function(d) {
            return graph.horizonLine([
                { angle: -graph.horizonAngle },
                { center: true, angle: 0 },
                { angle: graph.horizonAngle }
            ]);
        },

        updateHorizon: function() {
            graph.horizonDragGroup.selectAll(".horizonDragPoint")
                .attr({
                    "transform": function(d) {
                        // use the line generator to figure out where to put the point's center
                        return "translate(" + graph.horizonLine([{angle: (d == "left"? -1 : 1) * graph.horizonAngle}]).slice(1) + ")";
                    }
                });

            graph.horizonGroup.select(".horizonLine")
                .attr("d", Ring.drawHorizon);

            graph.centerOverlay.select(".horizonLine")
                .attr("d", Ring.drawHorizon);

            graph.horizonGroup.select(".horizonWedge-Topology")
                .attr("d", graph.horizonWedgeArc({
                    startAngle: graph.horizonAngle,
                    endAngle: tau - graph.horizonAngle
                }));

            graph.horizonGroup.select(".horizonWedge-Remote")
                .attr("d", graph.horizonWedgeArc({
                    startAngle: -graph.horizonAngle,
                    endAngle: graph.horizonAngle
                }));
        },

        update: function(animationTime, resize) {
            if(graph.isTopologyActive && !graph.isTopologyLoading) {
                graph.emptyRingFill.style("visibility", "hidden");
                graph.horizonGroup
                    .style("visibility", "visible")
                    .transition("fadeIn")
                        .duration(animationTime)
                        .style("opacity", 1);

                graph.horizonGroup.select(".horizonLine")
                        .attr("d", Ring.drawHorizon);

                graph.horizonDragGroup
                    .style("visibility", "visible")
                    .transition("fadeIn")
                        .duration(animationTime)
                        .style("opacity", 1);
            }
            else {
                graph.emptyRingFill.style("visibility", "visible");
                graph.horizonGroup.style({
                    "visibility": "hidden",
                    "opacity": 1e-6
                });

                graph.horizonDragGroup.style({
                    "visibility": "hidden",
                    "opacity": 1e-6
                });
            }
        }
    };

    return Ring;
};

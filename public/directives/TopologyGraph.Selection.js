SelectionCls = function(graph) {
    var Selection = {

        isDriftMode: false,
        menuItems: [],
        initialize: function() {
            graph.menuGroup = graph.centerOverlay.append("g")
                .attr("class", "menuGroup")
                .style("visibility", "hidden");

            var endpointMenu = graph.menuGroup.append("g")
                .attr("class", "endpointMenu");

            endpointMenu.append("path")
                .attr("class", "endpointMenuArc")
                .style({
                    "fill": "#ddd",
                    "stroke-width": "1",
                    "stroke": "#bbb"
                });

            graph.menuGroup.append("g")
                .attr("class", "flowMenu");

            graph.endpointMenuArc = d3.svg.arc();

            graph.currentMenuTarget = null;
            graph.currentMenu = null;

            graph.root.on("click", Selection.chartClick);
        },

        resize: function(sizes) {
            graph.endpointMenuArc
                .innerRadius(sizes.outerChartRadius + graph.sizes.endpointSelectionHighlight)
                .outerRadius(sizes.outerChartRadius + graph.sizes.endpointSelectionHighlight + graph.sizes.endpointMenuDepth);
        },

        update: function(animationTime, resize) {},

        fader: function(d, transition) {
            if (graph.currentMenuTarget) {
                // an item has been selected, lock the hover state
                return;
            }

            var flowMatchFn;
            var targetID;
            var childTargetID;
            var matches = d3.map();

            if (d.endpoint) {
                // expanded child
                targetID = d.endpoint.id;
                childTargetID = d.id;
                flowMatchFn = function(f) {
                    return (
                        (d.endpoint.id == f.srcTarget && d.id == f.srcExpandedTarget) ||
                        (d.endpoint.id == f.dstTarget && d.id == f.dstExpandedTarget)
                    );
                };
            } else if (d.id) {
                // endpoint (expanded or not)
                targetID = d.id;
                flowMatchFn = function(f) {
                    return (
                        d.id == f.srcTarget || d.id == f.dstTarget
                    );
                };
            } else {
                // flow line
                flowMatchFn = function(f) {
                    return (
                        d.srcTarget == f.srcTarget && d.srcExpandedTarget == f.srcExpandedTarget &&
                        d.dstTarget == f.dstTarget && d.dstExpandedTarget == f.dstExpandedTarget
                    );
                };
            }

            var lines = graph.chart.selectAll(".flowLine");

            lines.each(function(e) {
                var opacity;
                if (flowMatchFn(e)) {
                    opacity = 1;

                    addMatch(e.srcTarget, e.srcExpandedTarget);
                    addMatch(e.dstTarget, e.dstExpandedTarget);
                } else {
                    graph.Flow.stopPulse.call(this, e);
                    opacity = 0.1;
                }

                d3.select(this)
                    .classed("flowLine-active", (opacity == 1));

                e._selectionOpacity = opacity;
            });

            if (transition !== false) {
                lines = lines.transition("fade")
                    .duration(graph.hoverAnimationTime);
            }

            function addMatch(targetID, expandedTargetID) {
                var match = matches.get(targetID);
                if (!match) {
                    match = d3.set();
                    matches.set(targetID, match);
                }
                if (expandedTargetID) {
                    match.add(expandedTargetID);
                }
            }

            lines.style({
                "fill-opacity": graph.getter('_selectionOpacity'),
                "stroke-opacity": graph.getter('_selectionOpacity')
            });

            graph.chart.selectAll(".flowLine").filter(flowMatchFn)
                .call(graph.Flow.startPulse);

            var endpoints = graph.chart.selectAll(".endpoint");

            endpoints.each(function(e) {
                var opacity = 1;
                var match = matches.get(e.id);
                if (match) {
                    if (e.id == targetID) {
                        opacity = 1;
                    } else {
                        opacity = 0.5;
                    }
                } else {
                    opacity = 0.1;
                }

                e._selectionOpacity = opacity;

                if (e.isExpanded) {
                    d3.select(this).selectAll(".expandedChild").each(function(c) {
                        var childOpacity;
                        if (match && match.has(c.id)) {
                            if (!childTargetID || childTargetID == c.id) {
                                childOpacity = 1;
                            } else {
                                childOpacity = 0.5;
                            }
                        } else {
                            childOpacity = 0.1;
                        }
                        c._selectionOpacity = childOpacity;
                    });
                }
            });

            if (transition !== false) {
                endpoints = endpoints.transition("fade")
                    .duration(graph.hoverAnimationTime);
            }

            endpoints.selectAll(".arc")
                .style({
                    "fill-opacity": graph.getter('_selectionOpacity'),
                    "stroke-opacity": graph.getter('_selectionOpacity')
                });
        },

        unfader: function(transition) {
            if (graph.currentMenuTarget) {
                // an item has been selected, lock the hover state
                return;
            }

            var lines = graph.chart.selectAll(".flowLine");

            lines.classed("flowLine-active", false);

            if (transition !== false) {
                lines = lines.transition("fade")
                    .duration(graph.hoverAnimationTime);
            }

            lines.style({
                "fill-opacity": 1,
                "stroke-opacity": 1
            });

            var endpoints = graph.chart.selectAll(".endpoint")
                .selectAll(".arc");

            if (transition !== false) {
                endpoints = endpoints.transition("fade")
                    .duration(graph.hoverAnimationTime);
            }

            endpoints.style({
                "fill-opacity": 1,
                "stroke-opacity": 1,
            });
        },

        endpointMouseEnter: function(d) {
            Selection.fader(d, true);
        },
        endpointChildMouseEnter: function(d) {
            Selection.fader(d, true);
            d3.event.stopPropagation();
        },
        flowMouseEnter: function(d) {
            Selection.fader(d, true);
        },
        legendMouseEnter: function(d) {
            // this is unnecessary while we only have one flow type
        },

        endpointMouseLeave: function(d) {
            Selection.unfader(true);
        },
        endpointChildLeave: function(d) {
            Selection.unfader(true);
            d3.event.stopPropagation();
        },
        flowMouseLeave: function(d) {
            Selection.unfader(true);
        },
        legendMouseLeave: function(d) {
            // this is unnecessary while we only have one flow type
        },

        endpointClick: function(d) {
            Selection.selectTarget.call(this, d);
        },
        endpointChildClick: function(d) {
            Selection.selectTarget.call(this, d);
            d3.event.stopPropagation();
        },
        flowClick: function(d) {
            Selection.selectTarget.call(this, d);
        },

        chartClick: function() {
            // the click event bubbles upwards, so we need to check if the target was actually the outer chart
            if (d3.event.target === this) {
                // clear the selection if the user clicks in an empty area, unless a menu is currently active,
                // in which case close the menu but leave the selection
                if (graph.currentMenu) {
                    Selection.destroyMenu();
                    return;
                }
                Selection.selectTarget.call(this, null);
            }
        },

        selectTarget: function(d, type) {
            var showMenu = false;
            if (graph.currentMenuTarget != d) {
                //selection change - remove classes from the existing selection
                if (graph.currentMenuTarget) {
                    var oldSelection = graph.center.select(".current-selection")
                        .classed("current-selection", false);

                    if (graph.currentMenuTarget.endpoint) {
                        oldSelection.selectAll(".arc")
                            .style({
                                "stroke-width": 0
                            });
                    } else if (graph.currentMenuTarget.id) {
                        oldSelection.selectAll(".arc")
                            .style({
                                "stroke-width": 0
                            });
                    } else {
                        oldSelection.select(".flowPath")
                            .style({
                                "stroke-width": graph.sizes.flowLineWidth,
                            });
                        oldSelection.select(".flowPulseCircle")
                            .attr({
                                "r": graph.sizes.flowLineWidth,
                            });
                    }
                }

                graph.currentMenuTarget = null;

                // and highlight and recalculate the fade state for the new one
                if (d == null) {
                    Selection.unfader(true);
                } else {
                    if (d.endpoint) {
                        d3.select(this)
                            .classed("current-selection", true)
                            .select(".arc")
                            .style({
                                "stroke-width": graph.sizes.endpointSelectionHighlight
                            });
                        // selection is an endpoint child
                        Selection.unfader(false);
                        Selection.fader(d, false);
                    } else if (d.id) {
                        // selection is an endpoint
                        d3.select(this)
                            .classed("current-selection", true)
                            .select(".endpointArc")
                            .style({
                                "stroke-width": graph.sizes.endpointSelectionHighlight
                            });

                        Selection.unfader(false);
                        Selection.fader(d, false);
                    } else {
                        // selection is a flow
                        // we might have gotten here via the flow line or the flow hover line, so be careful about finding the right one.
                        var selectedFlow = graph.flowGroup.select(".flowLineType-" + d.flowType + ".flowLineSource-" + d.srcTarget + ".flowLineDest-" + d.dstTarget)
                            .classed("current-selection", true);

                        selectedFlow.select(".flowPath")
                            .style({
                                "stroke-width": graph.sizes.flowLineWidth + graph.sizes.flowLineSelectionBoost,
                            });
                        selectedFlow.select(".flowPulseCircle")
                            .attr({
                                "r": graph.sizes.flowLineWidth + graph.sizes.flowLineSelectionBoost,
                            });

                        Selection.unfader(false);
                        Selection.fader(d, false);
                    }

                }
                graph.currentMenuTarget = d;
                if (d) {
                    showMenu = true;
                }
            }
            /*
                The menu hides itself (and thus destroys itself) as part of the same click event as the selection.
                In order to allow hiding the menu while keeping the same element selected, a silly flag is needed.
            */
            else if (graph.currentMenu == null && d && !Selection.menuJustHidden) {
                showMenu = true;
            }
            Selection.menuJustHidden = false;

            if (showMenu) {
                if (graph.currentMenu) {
                    Selection.destroyMenu();
                }
                var menuItems;
                if (d.id) {
                    // selection is an endpoint (and possibly an expanded child)
                    var child = null;
                    var endpoint = d;
                    var title;
                    if (d.endpoint) {
                        // selection is an expanded child endpoint
                        child = d;
                        endpoint = d.endpoint;
                        title = graph.Endpoint.childEndpointTitle(child);
                    } else {
                        // selection is an endpoint
                        title = graph.Endpoint.fullName(d);
                    }
                    menuItems = [{
                        text: "Intra Endpoint View",
                        // if the node is expanded or not part of the topology, disable intra-view
                        disabled: child || !endpoint.inTopology || Selection.isDriftMode,
                        handler: function() {
                            /* graph.refOwner.addTab({
                                xtype: 'cb.insight.endpointintrasummarygrid',
                                title: title + ' - Intra Endpoint',
                                tabTip: title + ' - Intra Endpoint',
                                closable: true,
                                d: endpoint,
                                child: child,
                                graph: graph
                            }); */
                            console.log("TopologyGraph.Selection handle Intra Endpoint View");
                        }
                    }, {
                        text: "Inter Endpoint View",
                        handler: function() {
                            /* graph.refOwner.addTab({
                                xtype: 'panel',
                                title: title + ' - Inter Endpoint',
                                tabTip: title + ' - Inter Endpoint',
                                closable: true,
                                items: [{
                                    xtype: Selection.isDriftMode?'cb.whitelistendpointegresseventgrid':'cb.insight.endpointingresssummarygrid',
                                    d: endpoint,
                                    child: child,
                                    graph: graph
                                }, {
                                    xtype: Selection.isDriftMode?'cb.whitelistendpointingresseventgrid':'cb.insight.endpointingresssummarygrid',
                                    d: endpoint,
                                    child: child,
                                }],
                                layout:'vbox',
                                flex: true,
                                split: true,
                                border: false
                            }); */
                            console.log("TopologyGraph.Selection handle Inter Endpoint View");
                        }
                    }, {
                        text: (endpoint.isExpanded ? "Collapse" : "Expand"),
                        disabled: graph.expandingIDs.has(endpoint.id) || Selection.isDriftMode,
                        handler: function() {
                            console.log("TopologyGraph.Selection handle Expand / Collapse");
                            //graph.Endpoint.expandEndpoint(endpoint);
                        }
                    }];
                } else {
                    // selection is a flow
                    if (Selection.isDriftMode) {
                        menuItems = [{
                            text: "Drift Line Events",
                            handler: function() {
                                /* graph.refOwner.addTab({
                                    xtype: 'cb.whitelistlineeventgrid',
                                    title: graph.Flow.title(d),
                                    tabTip: graph.Flow.title(d),
                                    closable: true,
                                    d: d,
                                    graph: graph
                                }); */
                                console.log("TopologyGraph.Selection handle Drift Line Events");
                            }
                        }];
                    } else {
                        menuItems = [{
                            text: "Topology Line View",
                            handler: function() {
                                /* graph.refOwner.addTab({
                                    xtype: 'cb.insight.topologylinesummarygrid',
                                    title: graph.Flow.title(d),
                                    tabTip: graph.Flow.title(d),
                                    closable: true,
                                    d: d,
                                    graph: graph
                                }); */
                                console.log("TopologyGraph.Selection handle Topology Line View");
                                // Note: this is where we open a grid showing flows backing a line
                            }
                        }];
                    }
                }

                // spawn a menu going "inwards" from the endpoint
                // the anchor selection code in extjs doesn't understand SVG element sizing, so we need to compute that ourselves
                // we spawn the menu right next to the mouse, but a pixel off so that you can click again to dismiss it
                var root = graph.root.node();
                var offset = d3.mouse(root);
                offset[0] += 1;
                offset[1] += 1;

                //find the context menu
                var $contextMenu = angular.element($("#contextMenu"));

                //update the menu items tied to the context menu           
                $contextMenu.scope().chart.menuItems = menuItems;

                //apply scope to get the element to re-bind
                $contextMenu.scope().$apply();

                //move menu to near mouse
                $contextMenu.css({
                    display: "block",
                    left: offset[0],
                    top: offset[1]
                });

                console.log(menuItems);
                console.log('menu shown');

                //show menu
                setTimeout(function() {
                    $contextMenu.show();
                }, 100);

                // graph.currentMenu = new Ext.menu.Menu({
                //     items: menuItems,
                //     defaultOffsets: offset,
                //     listeners: {
                //         hide: function() {
                //             Selection.destroyMenu();
                //             Selection.menuJustHidden = true;
                //         },
                //         itemclick: function() {
                //             Selection.selectTarget.call(this, null);
                //         }
                //     }
                // });
                // graph.currentMenu.show(root, 'tl-tl');
            }

            //find SVG, find scope, call click event
            angular.element(this).scope().chart.actions.nodeClicked({ node: d });

            //  //find the context menu
            //     var $contextMenu = angular.element($("#contextMenu"));

            //     //update the menu items tied to the context menu           
            //     $contextMenu.scope().chart.menuItems = menuItems;

            //     //apply scope to get the element to re-bind
            //     $contextMenu.scope().$apply();

            //     //move menu to near mouse
            //     $contextMenu.css({
            //         display: "block",
            //         left: offset[0],
            //         top: offset[1]
            //     });

            //     //show menu
            //     $contextMenu.show();

        },

        destroyMenu: function() {
            graph.currentMenu.destroy();
            graph.currentMenu = null;
        },
        setDriftMode: function(shouldEnable) {
            Selection.isDriftMode = shouldEnable;
        }
    };
    return Selection;
};
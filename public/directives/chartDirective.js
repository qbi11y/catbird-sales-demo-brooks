var app = angular.module('D3chart', []);

var tau = Math.PI * 2;

app.factory('chordChart', function() {

    var chart = {
        animationTime: 750,
        initializeAnimationTime: 750,
        hoverAnimationTime: 250,
        flowPulseAnimationTime: 3000,

        chartWidth: 700,
        chartHeight: 700,
        minWidth: 60,
        minHeight: 60,

        sizes: {
            ringDepth: 5,
            endpointDepth: 15,
            endpointLabelMargin: 15,
            endpointMenuDepth: 16,
            endpointSelectionHighlight: 2,
            endpointExpandedParentDepth: 8,
            endpointExpandedMargin: 2,
            endpointExpandedChildDepth: 8,

            flowLineWidth: 3,
            flowLineHoverWidth: 10,
            flowLineWidthMargin: 4,
            flowLineDepthMargin: 5,
            flowLineSelectionBoost: 1,

            horizonLineWidth: 4,
            horizonExtension: 35,

            piePadding: 0.01,
            pieChildPadding: 0.01
        },

        chartMargins: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,

            outer: 60
        },

        // I based this list off of http://optional.is/required/2011/06/20/accessible-color-swatches/
        // which provides a set of color swatches with unique value components that should be easily
        // distinguishable for colorblind users
        accessibleColors: [
            "#FFF200", // light yellow
            "#BEEDAD", // seafoam green (lightened from #ABD69C)
            "#F7941E", // orange
            "#008FD5", // blue
            "#00603B", // forest green (darkened from #006F45)
            "#741472", // dark purple
            "#231F20" // near black
        ],

        colors: {

            warningText: "#990000",

            outerRing: "#ccc",
            outerRingSegment: "#a0a0a0",

            horizonLine: "#d6ddd6",
            horizonDragFill: "#aaa",
            horizonDragActiveFill: "#fff",
            horizonLineText: "#ccc",
            horizonTopologyFill: "#f9fcf9",
            horizonRemoteFill: "#fcfcfc",

            flow: {
                "NetFlow": "#008FD5",
                "IDSFlow": "#BEEDAD",
                "IPSFlow": "#F7941E",
                "ZACLAllowFlow": "#00603B",
                "ZACLDenyFlow": "#741472",
                "unapproved": "#F40000",
                "deviation": "#FFF200"
            },

            endpoint: {
                /* For these, these color ranges are also somewhat unusual, but they were chosen
                    while looking at Paletton to simulate some color blindness scenarios.
                    TrustZones are green-teal, NetworkObjects yellow-orange, and IP space purple-ish.

                    The chosen palette is a triad with 199 degree hue, and a 66 degree spread
                    the arrays are the color range (20 degrees of hue from each direction)
                */
                trustZone: ['#516F7C', '#689F65'], //#538373
                networkObject: ['#C5BF7C', '#C5AF7C'], //#c5b77c
                ip: ['#A26785', '#705785'] //#7e5281
            },

            flowShimmerH: 12,
            flowShimmerL: 0.25,
            flowGradientMagnitude: 1.3,
            cycleRange: 120
        },
        displayNames: {
            endpoint: {
                "trustZone": "TrustZone",
                "ip": "IP",
                "networkObject": "Network Object"
            },

            flow: {
                "NetFlow": "Net Flow",
                "IDSFlow": "IDS Flow",
                "IPSFlow": "IPS Flow",
                "ZACLAllowFlow": "ZACL Allow Flow",
                "ZACLDenyFlow": "ZACL Deny Flow",
                "unapproved": "Unapproved Connection",
                "deviation": "Flow Deviation"
            }
        },
        flowSort: ["NetFlow", "IDSFlow", "IPSFlow", "ZACLAllowFlow", "ZACLDenyFlow", "unapproved", "deviation"],

        // AWS_NOTE: The InsightPanel.js which previously contained this item, setup callbacks for topology creation state management.
        // isTopologyActive is true while this is an active session in the topology (used for some UI hinting)
        isTopologyActive: false,

        // isServerRefreshing is true while the server is calculating data, and cleared once the data is ready
        isServerRefreshing: false,

        // isTopologyLoading is true while a data refresh request is being performed, and cleared once the data is loaded
        isTopologyLoading: false,

        isDriftMode: false,   // all drift-mode-related stuff can be deleted for AWS demo...// d3 gives you lots of reasons to make functions to get this field from an element
        
        getter: function(key) {
            return function(item) {
                return item[key];
            };
        },

        // Sets up the top-level chart element once the DOM is ready
        renderChart: function(element, data) {
            if(this.chart && data) {
                this.loadData(data);
                this.initChart();   // sort of "create topology"; redraw endpoints, etc.
                this.myRenderChart();
            }
            else {
                this.el = element;
                this.chartEl = element; //this.el.down('.d3-chart', true);
                //this.loadingEl = this.el.down('.d3-loading', true);

                var outerWidth = this.chartWidth + this.chartMargins.left + this.chartMargins.right;
                var outerHeight = this.chartHeight + this.chartMargins.top + this.chartMargins.bottom;

                this.root = d3.select(this.chartEl).append('svg:svg')
                    .attr('width', outerWidth)
                    .attr('height', outerHeight);

                this.chart = this.root.append("g")
                    .attr("transform", "translate(" + this.chartMargins.left + "," + this.chartMargins.top + ")");

                //this.el.setSize(outerWidth, outerHeight);
                //this.renderChart();
                this.initComponent();
                this.initChart();
                this.loadData(data);
                this.myRenderChart();
            }
        },
        // Once the chart has both data and an element, this initializes and updates it
        myRenderChart: function() {
            if(this.chart && this.data) {
                if(!this.chartInitialized) {
                    if(this.loadingIndicator) {
                       this.hideLoadingIndicator();
                    }
                    this.initChart();
                    this.chartInitialized = true;
                    this.updateChart(0);
                }
                else {
                    this.updateChart();
                }
            }
            else {
                if(this.loadingIndicator) {
                    this.showLoadingIndicator();
                }
            }
        },
        initComponent: function() {
            //Catbird.Charts.D3Chart.superclass.initComponent.call(this);

            // initialize all our "subcomponent" classes which divide up the functionality
            this.subComponents = [
                this.Ring = RingCls(this),
                this.Selection = SelectionCls(this),
                this.Endpoint = EndpointCls(this),
                this.Flow = FlowCls(this),
                this.Legend = LegendCls(this)
            ];

            this.expandingIDs = d3.set();

            // also fake out the websocket...
            //this.setSocketConnected(true);
        },

        normalizeAngle: function(v, wrapPoint) {
            if(!wrapPoint)
                wrapPoint = tau;
            while(v < 0)
                v += wrapPoint;
            while(v > wrapPoint)
                v -= wrapPoint;
            return v;
        },

        interpolateAngle: function(a, b) {
            // interpolate between two angles, factoring in the possible need for wraparound
            var normalizeAngle = this.normalizeAngle;
            var d1 = normalizeAngle(b-a);
            var d2 = -normalizeAngle(a-b);
            var delta;
            if(Math.abs(d1) > Math.abs(d2)) {
                delta = d2;
            }
            else {
                delta = d1;
            }

            return function(i) {
                return normalizeAngle(a + (delta * i));
            }
        },

        createPathFragments: function(d, fragmentSize) {
            // Sample the SVG path string "d" uniformly with the specified precision.
            function sample(d) {
                var path = document.createElementNS(d3.ns.prefix.svg, "path");
                path.setAttribute("d", d);

                var n = path.getTotalLength(), t = [0], i = 0, dt = fragmentSize;
                while ((i += dt) < n) {
                    t.push(i);
                }
                t.push(n);

                return t.map(function(t) {
                    var p = path.getPointAtLength(t), a = [p.x, p.y];
                    a.t = t / n;
                    return a;
                });
            }

            // Compute quads of adjacent points [p0, p1, p2, p3].
            function quad(points) {
                return d3.range(points.length - 1).map(function(i) {
                    var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
                    a.t0 = points[i].t;
                    a.t1 = points[i + 1].t;
                    a.t = (a.t0 + a.t1) / 2;
                    return a;
                });
            }

            return quad(sample(d));
        },

        // Compute stroke outline for segment p12.
        drawPathFragments: function(p0, p1, p2, p3, startWidth, endWidth) {
            // Compute intersection of two infinite lines ab and cd.
            function lineIntersect(a, b, c, d) {
                var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
                    y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
                    ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
                return [x1 + ua * x21, y1 + ua * y21];
            }

            // Compute unit vector perpendicular to p01.
            function perp(p0, p1) {
                var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
                    u01d = Math.sqrt(u01x * u01x + u01y * u01y);
                return [u01x / u01d, u01y / u01d];
            }

            var u12 = perp(p1, p2),
                rs = startWidth / 2,
                re = endWidth / 2,
                a = [p1[0] + u12[0] * rs, p1[1] + u12[1] * rs],
                b = [p2[0] + u12[0] * re, p2[1] + u12[1] * re],
                c = [p2[0] - u12[0] * re, p2[1] - u12[1] * re],
                d = [p1[0] - u12[0] * rs, p1[1] - u12[1] * rs];

            if (p0) {
                // clip ad and dc using average of u01 and u12
                var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
                a = lineIntersect(p1, e, a, b);
                d = lineIntersect(p1, e, d, c);
            }

            if (p3) {
                // clip ab and dc using average of u12 and u23
                var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
                b = lineIntersect(p2, e, a, b);
                c = lineIntersect(p2, e, d, c);
            }

            return "M" + a + "L" + b + " " + c + " " + d + "Z";
        },

        colorPicker: function(colorRange) {
            /*
                Return function(id) to get the color for an ID.
                Colors are chosen by endlessly subdividing the color range,
                i.e. for the range 0..1 the items along the range will be:
                    1/2, 1/4, 3/4, 1/8, 3/8, 5/8, 7/8, 1/16, ....

                Colors are also stable for a given ID.
            */
            var idMap = d3.map();
            var index = 0;
            var colorScale = d3.scale.linear()
                .domain([0, 1])
                .range(colorRange);

            return function getColorForID(id) {
                if(idMap.has(id)) {
                    return idMap.get(id);
                }
                // generate a new color by figuring out the next fractional slice
                // this generates 1/2, 1/4, 3/4, 1/8, 3/8, 5/8, 7/8, 1/16, etc
                index++;
                var numerator = 2 * (index - Math.pow(2, Math.ceil(Math.log(index, 2) - 1))) - 1;
                var denominator = (Math.floor(Math.pow(2, Math.ceil(Math.log(index, 2)))));

                var color = colorScale(numerator / denominator);
                idMap.set(id, color);
                return color;
            };
        },

        loadData: function(data) {
            /*AWS_NOTE: data is expected to be an aggregated set of flows based upon the topology and flow filters selected
              by the user.

              Input:
                   existingSchema.filters -- A dictionary of filter names/values
              Output:
                   Dictionary containing the following key/value pairs.  Note that the format of this
                   output needs to match uiinsight._getInsightTopologyData() as they fulfill the same
                   endpoint
                       success -- Boolean indicating whether the query succeeded
                       session -- True if there is an existing insight schema from which to query, False
                           otherwise
                       endpoints -- The union of all of the endpoints in the topology with all of the endpoints
                           represented by either end of the flow lines
                       filters -- The filters that were passed in
                       flows -- The aggregated set of filtered flows
                       endpointWarning -- True if the maximum number of endpoints was hit
                       lineWarning -- True if the maximum number of flow lines was hit

            "flows" Dictionary with keys:
               "flowType",
               "srcType",   endpoint type, an enum representing "IP Space" or "Security Group"
               "srcTarget", IP address or security group ID
               "srcExpandedTarget", Null for now
               "dstType",  As above
               "dstTarget",
               "dstExpandedTarget"

               endpoint = dict(
                           id=endpointID,
                           type=endpointType,
                           name=name,
                           inTopology=inTopology
                       )

            See dummy data at bottom...
            */

            
            if (!data) {
                console.log("no data!");
                return;
            }
            console.log("data!");
            this.data = data;

            // clear the expansion-in-progress set
            this.expandingIDs = d3.set();
            // precalculate some derived attributes of the data
            this.endpointMap = {};
            this.endpointCountsByType = {};
            this.flowCountsByType = {};
            var bundleKeys = {};
            var i;
            var j;

            data.topologyEndpoints = [];
            data.remoteEndpoints = [];

            if(!data.session) {
                this.isTopologyActive = false;
                data.endpoints = [];
                data.flows = [];

                this.renderChart();
                return;
            }
            this.isTopologyActive = true;

            // build a map of all endpoints by ID for lookup
            var allEndpoints = data.endpoints;
            var endpoint;
            console.log("endpoints = " + allEndpoints);
            for(i = 0; i < allEndpoints.length; i++) {
                endpoint = allEndpoints[i];

                this.endpointMap[endpoint.id] = endpoint;
                endpoint.incomingCount = 0;
                endpoint.outgoingCount = 0
                endpoint.totalCount = 0;
                endpoint.isExpanded = false;

                if(!endpoint.name) {
                    if(endpoint.type == "ip") {
                        endpoint.name = "IP Space";
                    }
                    else {
                        endpoint.name = '';
                    }
                }

                if(!(endpoint.flowType in this.endpointCountsByType)) {
                    this.endpointCountsByType[endpoint.flowType] = 0;
                }
                endpoint.indexByType = this.endpointCountsByType[endpoint.flowType]++;

                // put the endpoint categories in the record for later use
                if(endpoint.inTopology) {
                    endpoint.placement = "topology";
                    data.topologyEndpoints.push(endpoint);
                }
                else {
                    endpoint.placement = "remote";
                    data.remoteEndpoints.push(endpoint);
                }
            }

            // sort the flows by type so they hopefully lay out more nicely
            var flowSort = this.flowSort;
            data.flows.sort(function(a, b) {
                return d3.ascending(flowSort.indexOf(a.flowType), flowSort.indexOf(b.flowType));
            });
            var flow, src, dst;

            console.log("flow len = " + data.flows.length);
            for(i = 0; i < data.flows.length; i++) {
                flow = data.flows[i];

                // link flows to their src and destination
                src = this.endpointMap[flow.srcTarget];
                dst = this.endpointMap[flow.dstTarget];
                src.outgoingCount += 1;
                dst.incomingCount += 1;

                if(!(flow.flowType in this.flowCountsByType)) {
                    this.flowCountsByType[flow.flowType] = 0;
                }
                this.flowCountsByType[flow.flowType] += 1;

                var endpoints = [["src", src], ["dst", dst]];
                var entry;
                for(j = 0; j < endpoints.length; j++) {
                    var direction = endpoints[j][0];
                    endpoint = endpoints[j][1];

                    // track flow count summaries on the endpoints
                    endpoint.totalCount += 1;

                    // and track expanded node IDs
                    var expandedID = flow[direction + 'ExpandedTarget'];
                    if(expandedID) {
                        if(!endpoint.isExpanded) {
                            endpoint.isExpanded = true;
                            endpoint.expandedIDs = d3.map();
                        }

                        entry = endpoint.expandedIDs.get(expandedID);
                        if(!entry) {
                            entry = {
                                name: flow[direction + 'ExpandedTargetName'],
                                totalCount: 0,
                                incomingCount: 0,
                                outgoingCount: 0,
                            };
                            endpoint.expandedIDs.set(expandedID, entry);
                        }

                        entry.totalCount += 1;
                        if(direction == "src") {
                            entry.outgoingCount += 1;
                        }
                        else {
                            entry.incomingCount += 1;
                        }
                    }
                }
            }

            // after processing the flows we have info on expanded endpoints, and need to figure out how to lay those out.
            // this is also the stage where we translate the asset names we've found for expanded trustzones
            for(i = 0; i < allEndpoints.length; i++) {
                endpoint = allEndpoints[i];
                if(endpoint.isExpanded) {
                    var expandedIDs = endpoint.expandedIDs.entries();
                    for(j = 0; j < expandedIDs.length; j++) {
                        var entry = expandedIDs[j];
                        var name = entry.key;

                        expandedIDs[j] = {
                            index: j,
                            endpoint: endpoint,
                            placement: endpoint.placement,
                            id: entry.key,
                            name: entry.value.name,
                            totalCount: entry.value.totalCount,
                            incomingCount: entry.value.incomingCount,
                            outgoingCount: entry.value.outgoingCount
                        };
                    }
                    expandedIDs.sort(function(a, b) {
                        return d3.ascending(a.name, b.name);
                    });
                    endpoint.expandedIDs = expandedIDs;
                    endpoint.expandedIDMap = d3.map(expandedIDs, this.getter('id'));
                }
            }

            // because of how we want to layout the flows, we need to calculate their "indexes" along the arc.
            // in order to use the total counts from the previous loop, this needs to be it's own loop
            for(i = 0; i < data.flows.length; i++) {
                flow = data.flows[i];
                src = this.endpointMap[flow.srcTarget];
                dst = this.endpointMap[flow.dstTarget];

                if(flow.srcExpandedTarget) {
                    src = src.expandedIDMap.get(flow.srcExpandedTarget);
                }
                if(flow.dstExpandedTarget) {
                    dst = dst.expandedIDMap.get(flow.dstExpandedTarget);
                }

                if(!("_outFlowsSeen" in src)) {
                    src._outFlowsSeen = 0;
                }
                if(!("_inFlowsSeen" in dst)) {
                    dst._inFlowsSeen = 0;
                }
                flow.srcIndex = (src._outFlowsSeen++);
                flow.dstIndex = (dst._inFlowsSeen++) + dst.outgoingCount;
            }

            // lastly, cleanup temp attributes
            for(i = 0; i < allEndpoints.length; i++) {
                endpoint = allEndpoints[i];
                if("_inFlowsSeen" in endpoint) {
                    delete endpoint._inFlowsSeen;
                }
                if("_outFlowsSeen" in endpoint) {
                    delete endpoint._outFlowsSeen;
                }
            }

            this.myRenderChart();
        },

        refreshData: function(callback, scope) {
            if(!this.isTopologyLoading) {
                this.setTopologyLoading(true);
                /* Catbird.ss.Insight.getTopologyData(this.isDriftMode, function(response) {
                    this.setTopologyLoading(false);

                    if(response && response.success) {
                        this.loadData(response);
                        if(callback) {
                            callback.call(scope, response);
                        }
                    }
                }, this); */
                console.log("chartDirective.js refreshData()");
                this.loadData(this.data);
            }
        },

        setCreationProgress: function(data) {
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].setCreationProgress) {
                    this.subComponents[i].setCreationProgress(data);
                }
            }
        },

        setSocketConnected: function(connected, details) {
            this.isSocketConnected = connected;

            // notify our subcomponents
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].setSocketConnected) {
                    this.subComponents[i].setSocketConnected(connected, details);
                }
            }
        },

        setServerRefreshing: function(refreshing) {
            this.isServerRefreshing = refreshing;

            // notify our subcomponents
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].setServerRefreshing) {
                    this.subComponents[i].setServerRefreshing(refreshing);
                }
            }
        },

        setTopologyLoading: function(loading) {
            this.isTopologyLoading = loading;

            // notify our subcomponents
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].setTopologyLoading) {
                    this.subComponents[i].setTopologyLoading(loading);
                }
            }
        },

        initChart: function() {

            this.degreeScale = d3.scale.linear()
                .domain([0, tau])
                .range([0, 360]);


            // in order to force some elements onto the top, we have two root elements. they're otherwise identical.
            this.center = this.chart.append("g")
                .attr("class", "chartCenter");

            this.centerOverlay = this.chart.append("g")
                .attr("class", "chartCenterOverlay");

            // this overlay is used while dragging to "cancel" hover behaviors by being on top
            this.centerOverlay.append("circle")
                .attr("class", "dragHoverOverlay")
                .style({
                    "visibility": "hidden",
                    "opacity": 0
                });

            // initialize our subcomponents
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].initialize) {
                    this.subComponents[i].initialize();
                }
            }

            // position the elements on the chart
            this.resizeChart(false);
        },

        resizeChart: function(update) {
            var centerTransform = "translate(" + this.chartWidth / 2 + "," + this.chartHeight / 2 + ")";
            this.center.attr("transform", centerTransform);
            this.centerOverlay.attr("transform", centerTransform);

            // calculate the sizes that elements will be based off of
            var outerChartRadius = Math.max(40, (Math.min(this.chartWidth, this.chartHeight) / 2) - this.chartMargins.outer);
            var outerRingRadius = outerChartRadius - this.sizes.endpointDepth;
            var innerRingRadius = outerRingRadius - this.sizes.ringDepth;

            var sizes = {
                outerChartRadius: outerChartRadius,
                outerRingRadius: outerRingRadius,
                innerRingRadius: innerRingRadius
            };

            this.centerOverlay.select(".dragHoverOverlay")
                .attr("r", outerChartRadius + this.chartMargins.outer + this.sizes.endpointLabelMargin);

            // resize our subcomponents
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].resize) {
                    this.subComponents[i].resize(sizes, update);
                }
            }

            // We don't want to do wavy motions in resize updates
            if(update !== false) {
                this.updateChart(0, true);
            }
        },

        updateChart: function(animationTime, resize) {
            var me = this;

            if(typeof(animationTime) != 'number') {
                animationTime = this.animationTime;
            }

            // update our subcomponents
            for(var i = 0; i < this.subComponents.length; i++) {
                if(this.subComponents[i].update) {
                    this.subComponents[i].update(animationTime, resize);
                }
            }

        },

        setDriftMode: function(shouldEnable) {
            // TODO: update any subcomponents as appropriate.
            this.isDriftMode = shouldEnable;
            this.Selection.setDriftMode(shouldEnable);  // hide endpoint expansion in drift mode...
        }
    };

    return chart;

});

app.directive('d3chart', ['chordChart', function(chordChart) {

    return {
        restrict: 'E',
        scope: {
            data: '='
        },
        link: function(scope, element, attrs) {

            scope.chart = chordChart;
            scope.chart.renderChart(element[0], null);

            scope.$watch('data', function(newData, oldData) {
                console.log("chartDirective.js watch callback newData = " + newData);
                // if 'val' is undefined, exit
                if (!newData) {
                    return;
                }

                scope.chart.renderChart(element[0], newData);

            });
        }
    }
}]);
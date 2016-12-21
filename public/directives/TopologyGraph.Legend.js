LegendCls = function(graph) {
    var Legend = {

        warningTextHeight: 15,
        warningTextWidth: 20,
        numWarnings: 0,

        initialize: function() {
            graph.legend = graph.chart.append("g")
                .attr("class", "chartLegend");

            graph.legendWarnings = graph.legend.append("g")
                .attr("class", "legendWarnings");

            graph.lineWarning = graph.legendWarnings.append("text")
                .style('visibility', 'hidden')
                .attr({
                    "fill": graph.colors.warningText,
                    "height": Legend.warningTextHeight,
                    "width": Legend.warningTextWidth,
                    "y": Legend.warningTextHeight,
                })
                .text('Topology exceeds the maximum amount of flows.');

            graph.endpointWarning = graph.legendWarnings.append("text")
                .style('visibility', 'hidden')
                .attr({
                    "fill": graph.colors.warningText,
                    "height": Legend.warningTextHeight,
                    "width": Legend.warningTextWidth,
                    "y": Legend.warningTextHeight,
                })
                .text('Topology exceeds the maximum amount of endpoints.');
        },

        text: function(d) {
            return d.name + " (" + d.count + ")";
        },

        dashArray: function(d) {
            if(d.flowType in {'IPSFlow': true, 'ZACLDenyFlow': true}) {
                return "8, 5";
            }
            return "none";
        },

        reloadWarnings: function (lineWarning, endpointWarning) {
            Legend.numWarnings = 0;

            if (lineWarning) {
                graph.lineWarning.style('visibility', 'visible');
                Legend.numWarnings++;
            } else {
                graph.lineWarning.style('visibility', 'hidden');
            }

            if (endpointWarning) {
                graph.endpointWarning.attr("y", Legend.numWarnings*Legend.warningTextHeight);
                graph.endpointWarning.style('visibility', 'visible');
                Legend.numWarnings++;
            } else {
                graph.endpointWarning.style('visibility', 'hidden');
            }
        },

        update: function(animationTime, resize) {
            var lineHeight = 15;
            var legendData = [];
            var row = 0;
            for(var i = 0; i < graph.flowSort.length; i++) {
                var flowType = graph.flowSort[i];
                if(!(flowType in graph.flowCountsByType)) {
                    continue;
                }
                legendData.push({
                    flowType: flowType,
                    row: row++,
                    color: graph.colors.flow[flowType],
                    name: graph.displayNames.flow[flowType],
                    count: graph.flowCountsByType[flowType]
                });
            }

            if (graph.isTopologyActive) {
                Legend.reloadWarnings(graph.data.lineWarning, graph.data.endpointWarning);
            }

            var warningTextHeight = (Legend.warningTextHeight * Legend.numWarnings);
            var legendHeight = warningTextHeight + (row * lineHeight);

            function transform(d) {
                return "translate(32, " + (-legendHeight + ((d.row+1)* lineHeight)) + ")";
            }

            graph.legend
                .attr({
                    transform: "translate(0, " + legendHeight + ")",
                    height: legendHeight,
                    stroke: "1px solid #000"
                }).style({
                    stroke: "2px black solid"
                });

            var entries = graph.legend.selectAll(".legendEntry")
                .data(legendData, graph.getter("flowType"));

            entries
                .attr("transform", transform);

            entries.select("text")
                .text(Legend.text);

            var newEntry = entries.enter()
                .append("g")
                .attr("class", "legendEntry")
                .attr("transform", transform);

            newEntry.append("path")
                .attr({
                    "d": "M 4, 0 L24, 0",
                    "transform": "translate(-32, " + (-lineHeight/3) + ")"
                })
                .style({
                    "stroke-width": 4,
                    "stroke-linecap": "round",
                    "stroke": graph.getter("color")
                });

            newEntry.append("text")
                .text(Legend.text);

            newEntry.on("mouseenter", graph.Selection.legendMouseEnter)
                .on("mouseout", graph.Selection.legendMouseLeave);

            entries.exit()
                .remove();
        }
    };
    return Legend;
};

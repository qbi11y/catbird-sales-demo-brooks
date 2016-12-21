Catbird.Insight.TopologyLineSummaryGrid = Ext.extend(Ext.grid.GridPanel, {

    initComponent: function() {
        var filterer = new Catbird.GridHeaderFilters();

        var d = this.d;

        var topologyLineStore = new Catbird.Store({
            remoteSort: true,
            autoDestroy: true,
            reader: new Ext.data.JsonReader({
                root: 'flows',
                idProperty: 'id',
                successProperty: 'success',
            },
                Ext.data.Record.create([
                    'srcIPAssetID',
                    'srcIP',
                    'dstIPAssetID',
                    'dstIP',
                    'dstPort',
                    'protocol',
                    'flowCount',
                    'flowType'
                ])
            ),
            writer: new Ext.data.JsonWriter({
                encode: false,
                writeAllFields: false
            }),
            proxy: new Catbird.DirectProxy({
                api: {
                    read: Catbird.ss.Insight.getTopologyFlowSummaryLine
                }
            }),
            baseParams: {
                sourceType: d.srcType,
                sourceID: d.srcTarget,
                sourceExpID: d.srcExpandedTarget,
                destinationType: d.dstType,
                destinationID: d.dstTarget,
                destinationExpID: d.dstExpandedTarget,
                dstPortType: '<',
                dstPortValue: '49152',
                flowType: d.flowType
            }
        });

        Ext.apply(this, {
            xtype: 'grid',

            tbar: {
                xtype: 'cb.paging',
                store: topologyLineStore,
                items: [
                    '-',
                    {
                        xtype: 'tbbutton',
                        text: 'Clear Filters',
                        scope: this,
                        handler: function(f) {
                            this.resetHeaderFilters(true);
                        }
                    },
                    '->',
                    {
                        xtype: 'tbbutton',
                        text: 'Raw Flows',
                        scope: this,
                        handler: function() {
                            this.graph.refOwner.addTab({
                                xtype: 'cb.insight.rawflowgrid',
                                title: this.graph.Flow.title(d) + ' - Raw Flows',
                                tabTip: this.graph.Flow.title(d) + ' - Raw Flows',
                                closable: true,
                                srcTarget: d.srcTarget,
                                dstTarget: d.dstTarget,
                                srcEndpointID: d.srcExpandedTarget,
                                dstEndpointID: d.dstExpandedTarget,
                                flowType: d.flowType
                            });
                        }
                    },
                    '-',
                    {
                        xtype: 'cb.gridcolumnmenu',
                        grid: this
                    }
                ]
            },

            plugins: [ filterer ],

            view: new Catbird.GridView({
                emptyText: 'No flows to display.'
            }),

            cm: new Ext.grid.ColumnModel({
                defaults: {
                    width: 120,
                    sortable: true,
                    renderer: 'htmlEncode'
                },
                columns: [{
                        header: 'Destination Port',
                        dataIndex: 'dstPort',
                        filter: { xtype: 'cb.flowexpressionfilterfield', filterName: 'dstPort', filterPorts: true }
                    },{
                        header: 'Source IP',
                        dataIndex: 'srcIP',
                        filter: { xtype: 'textfield', filterName: 'srcIP' }
                    },{
                        header: 'Source Asset',
                        dataIndex: 'srcIPAssetID',
                        renderer: Catbird.format.translateEndpoint,
                        filter: { xtype: 'textfield', filterName: 'srcIPAssetName' }
                    },{
                        header: 'Destination IP',
                        dataIndex: 'dstIP',
                        filter: { xtype: 'textfield', filterName: 'dstIP' }
                    },{
                        header: 'Destination Asset',
                        dataIndex: 'dstIPAssetID',
                        renderer: Catbird.format.translateEndpoint,
                        filter: { xtype: 'textfield', filterName: 'dstIPAssetName' }
                    },{
                        header: 'Protocol',
                        dataIndex: 'protocol', renderer: Catbird.format.mapRenderer(Catbird.format.flowProtocolMap),
                        filter: Catbird.filter.makeCheckboxFilter('protocol', Catbird.format.flowProtocolMap)
                    },{
                        header: 'Type',
                        dataIndex: 'flowType',
                        renderer: Catbird.format.mapRenderer(Catbird.format.flowTypeMap)
                    },{
                        header: 'Flow Count',
                        dataIndex: 'flowCount'
                    }
                ]
            }),

            store: topologyLineStore,

            listeners: {
                scope: this,
                render: function(g) {
                    g.topToolbar.doRefresh();
                }
            }
        });

        Catbird.Insight.TopologyLineSummaryGrid.superclass.initComponent.call(this);
    }
});
Ext.reg('cb.insight.topologylinesummarygrid', Catbird.Insight.TopologyLineSummaryGrid);

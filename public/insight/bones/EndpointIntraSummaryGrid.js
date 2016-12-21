Catbird.Insight.EndpointIntraSummaryGrid = Ext.extend(Ext.grid.GridPanel, {

    initComponent: function() {
        var filterer = new Catbird.GridHeaderFilters();
        var d = this.d;

        var endpointIntraStore = new Catbird.Store({
            autoDestroy: true,
            remoteSort: true,
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
                    'flowCount'
                ])
            ),
            writer: new Ext.data.JsonWriter({
                encode: false,
                writeAllFields: false
            }),
            proxy: new Catbird.DirectProxy({
                api: {
                    read: Catbird.ss.Insight.getTopologyFlowSummaryInside
                }
            }),
            baseParams: {
                targetType: d.type,
                targetID: d.id,
                dstPortType: '<',
                dstPortValue: '49152'
            }
        });

        Ext.apply(this, {
            plugins: [ filterer ],

            tbar: {
                xtype: 'cb.paging',
                store: endpointIntraStore,
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
                                title: this.graph.Endpoint.fullName(d) + ' - Intra Raw Flows',
                                tabTip: this.graph.Endpoint.fullName(d) + ' - Intra Raw Flows',
                                closable: true,
                                srcTarget: d.id,
                                dstTarget: d.id,
                                srcEndpointID: null,
                                dstEndpointID: null,
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
                        header: 'Destination Port',
                        dataIndex: 'dstPort',
                        filter: { xtype: 'cb.flowexpressionfilterfield', filterName: 'dstPort', filterPorts: true }
                    },{
                        header: 'Flow Count',
                        dataIndex: 'flowCount'
                    }
                ]
            }),

            store: endpointIntraStore,

            listeners: {
                scope: this,
                render: function(g) {
                    g.topToolbar.doRefresh();
                }
            }
        });

        Catbird.Insight.EndpointIntraSummaryGrid.superclass.initComponent.call(this);
    }

});
Ext.reg('cb.insight.endpointintrasummarygrid', Catbird.Insight.EndpointIntraSummaryGrid);

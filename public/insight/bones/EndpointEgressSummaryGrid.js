Catbird.Insight.EndpointEgressSummaryGrid = Ext.extend(Ext.grid.GridPanel, {

    initComponent: function() {
        var egressfilterer = new Catbird.GridHeaderFilters();
        var d = this.d;
        var expandedID = null;

        if (this.child) {
            expandedID = this.child.id;
        }

        var endpointEgressStore = new Catbird.Store({
            autoDestroy: true,
            remoteSort: true,
            reader: new Ext.data.JsonReader({
                root: 'flows',
                idProperty: 'id',
                successProperty: 'success',
            },
                Ext.data.Record.create([
                    'dstPort',
                    'dstIP',
                    'dstIPAssetID',
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
                    read: Catbird.ss.Insight.getTopologyFlowSummaryOut
                }
            }),
            baseParams: {
                targetType: d.type,
                targetID: d.id,
                expandedID: expandedID,
                dstPortType: '<',
                dstPortValue: '49152'
            }
        });

        Ext.apply(this, {
            title: 'Egress',
            flex: 2,

            plugins: [ egressfilterer ],

            tbar: {
                xtype: 'cb.paging',
                store: endpointEgressStore,
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

            store: endpointEgressStore,
            listeners: {
                scope: this,
                render: function(g) {
                    g.topToolbar.doRefresh();
                }
            }
        });

        Catbird.Insight.EndpointEgressSummaryGrid.superclass.initComponent.call(this);
    }
});
Ext.reg('cb.insight.endpointegresssummarygrid', Catbird.Insight.EndpointEgressSummaryGrid);

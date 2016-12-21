Catbird.Insight.EndpointIngressSummaryGrid = Ext.extend(Ext.grid.GridPanel, {

    initComponent: function() {
        var ingressfilterer = new Catbird.GridHeaderFilters();
        var d = this.d;
        var expandedID = null;

        if (this.child) {
            expandedID = this.child.id;
        }

        var endpointIngressStore = new Catbird.Store({
            autoDestroy: true,
            remoteSort: true,
            reader: new Ext.data.JsonReader({
                root: 'flows',
                idProperty: 'id',
                successProperty: 'success',
            },
                Ext.data.Record.create([
                    'dstPort',
                    'srcIP',
                    'srcIPAssetID',
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
                    read: Catbird.ss.Insight.getTopologyFlowSummaryIn
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
            title: 'Ingress',
            flex: 2,

            plugins: [ ingressfilterer ],

            tbar: {
                xtype: 'cb.paging',
                store: endpointIngressStore,
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
                        text: 'Ingress & Egress Raw Flows',
                        scope: this,
                        handler: function() {
                            var endpointID = null;
                            if(this.child !== null && this.child !== undefined) {
                                endpointID = this.child.id;
                            }
                            this.graph.refOwner.addTab({
                                xtype: 'cb.insight.rawflowgrid',
                                title: this.graph.Endpoint.fullName(d) + ' - Inter Raw Flows',
                                tabTip: this.graph.Endpoint.fullName(d) + ' - Inter Raw Flows',
                                closable: true,
                                srcTarget: d.id,
                                dstTarget: null,
                                srcEndpointID: endpointID,
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

            store: endpointIngressStore,
            listeners: {
                scope: this,
                render: function(g) {
                    g.topToolbar.doRefresh();
                }
            }
        });

        Catbird.Insight.EndpointIngressSummaryGrid.superclass.initComponent.call(this);
    }
});
Ext.reg('cb.insight.endpointingresssummarygrid', Catbird.Insight.EndpointIngressSummaryGrid);

Catbird.Insight.TopologyFlowGrid = Ext.extend(Catbird.Grid, {
    initComponent : function() {
        var filterer = new Catbird.GridHeaderFilters();
        var toolbarItems = [

            '->',
            '-',
            {
                xtype: 'cb.gridcolumnmenu',
                grid: this
            },
            '->',
            {
                xtype: 'tbbutton',
                text: 'Export',
                scope: this,
                handler: function(f) {
                    this.openCSVExportDialog({});
                }
            },
        ];

        Ext.apply(this, {
            tbar: {
                xtype: 'cb.paging',
                store: this.store,
                items: toolbarItems
            },

            view: new Catbird.GridView({
                emptyText: 'No flows to display.'
            }),

            plugins: [ filterer ],

            cm: new Ext.grid.ColumnModel({
                defaults: {
                    width: 10,
                    sortable: true,
                    renderer: 'htmlEncode'
                },
                columns: [{
                        header: "Begin Time",
                        renderer: Catbird.format.date,
                        dataIndex: 'minTime'
                    },{
                        header: "End Time",
                        renderer: Catbird.format.date,
                        dataIndex: 'maxTime'
                    },{
                        header: "Flow Count",
                        dataIndex: 'flowCount'
                    },{
                        header: "Type",
                        dataIndex: 'flowType',
                        renderer: Catbird.format.mapRenderer(Catbird.format.flowTypeMap)
                    },{
                        header: "Source Asset Name",
                        sortable: false,
                        dataIndex: 'srcIPAssetID',
                        renderer: Catbird.format.translateAssetLink
                    },{
                        header: "Destination Asset Name",
                        sortable: false,
                        dataIndex: 'dstIPAssetID',
                        renderer: Catbird.format.translateAssetLink
                    },{
                        header: "Source IP",
                        dataIndex: 'srcIP'
                    },{
                        header: "Protocol",
                        dataIndex: 'protocol',
                        renderer: Catbird.format.mapRenderer(Catbird.format.flowProtocolMap)
                    },{
                        header: "Destination Port", width: 5,
                        dataIndex: 'dstPort'
                    },{
                        header: "Destination IP",
                        dataIndex: 'dstIP'
                    },{
                        header: "Source Object",
                        sortable: false,
                        dataIndex: 'srcIPObjectName',
                        renderer: Catbird.format.translateEndpoint
                    },{
                        header: "Destination Object",
                        sortable: false,
                        dataIndex: 'dstIPObjectName',
                        renderer: Catbird.format.translateEndpoint
                    },
                ]
            }),

            listeners: {
                render: function() {
                    // there can be 100,000 pages on this grid if you make it tiny, so we need a wider input box
                    this.topToolbar.inputItem.setWidth(50);
                    console.log("Catbird.TopologyFlowGrid render");
                }
            }

        });

        // super
        Catbird.Insight.TopologyFlowGrid.superclass.initComponent.call(this);
    },
});

Ext.reg('cb.insight.topologyflowgrid', Catbird.Insight.TopologyFlowGrid);

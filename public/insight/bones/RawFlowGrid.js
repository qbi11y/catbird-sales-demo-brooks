Catbird.Insight.RawFlowGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent : function() {
        var filterer = new Catbird.GridHeaderFilters();

        var d = this.d;

        var toolbarItems = [
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
        ];

        var store = new Catbird.Store({
            autoDestroy: true,
            autoLoad: true,
            reader: new Ext.data.JsonReader({
                root: 'flows',
                idProperty: 'flowID',
                successProperty: 'success',
            }, Ext.data.Record.create([
                'flowID',
                'beginTime',
                'flowType',
                'protocol',

                'srcIPAssetID',
                'srcIP',
                'srcPort',

                'dstIPAssetID',
                'dstIP',
                'dstPort',

                'vlanID',
                'ipsPolicyID',

                'sid',
                'count',
                'bytes',

                'rulesetVersionID',
                'ruleID',

                'srcTargetID',
                'dstTargetID'
            ])),
            proxy: new Catbird.DirectProxy({
                api: {
                    read: Catbird.ss.Insight.getRawFlows,
                }
            }),
            baseParams: {
                'src': this.srcTarget,
                'dst': this.dstTarget,
                'srcExpandedID': this.srcEndpointID,
                'dstExpandedID': this.dstEndpointID,
                'flowType': this.flowType
            }
        })

        Ext.apply(this, {
            tbar: {
                xtype: 'cb.paging',
                store: store,
                items: toolbarItems
            },

            store: store,

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
                        header: "Timestamp",
                        renderer: Catbird.format.date,
                        dataIndex: 'beginTime',
                        filter: Catbird.filter.makeDateFilter('beginTime')
                    },{
                        header: "Type",
                        dataIndex: 'flowType', renderer: Catbird.format.mapRenderer(Catbird.format.flowTypeMap),
                        filter: this.flowType?null:Catbird.filter.makeCheckboxFilter('flowType', Catbird.format.getEnabledFlowTypes())
                    },{
                        header: "Source Asset Name", sortable: false,
                        dataIndex: 'srcIPAssetID', renderer: Catbird.format.translateAssetLink,
                        filter: { xtype: 'textfield', filterName: 'srcIPAssetName' }
                    },{
                        header: "Destination Asset Name", sortable: false,
                        dataIndex: 'dstIPAssetID', renderer: Catbird.format.translateAssetLink,
                        filter: { xtype: 'textfield', filterName: 'dstIPAssetName' }
                    },{
                        header: "Protocol",
                        dataIndex: 'protocol', renderer: Catbird.format.mapRenderer(Catbird.format.flowProtocolMap),
                        filter: Catbird.filter.makeCheckboxFilter('protocol', Catbird.format.flowProtocolMap)
                    },{
                        header: "Source IP",
                        dataIndex: 'srcIP',
                        filter: { xtype: 'textfield', filterName: 'srcIP' }
                    },{
                        header: "Source Port", width: 5,
                        dataIndex: 'srcPort',
                        filter: { xtype: 'cb.flowexpressionfilterfield', filterName: 'srcPort' }
                    },{
                        header: "Destination IP",
                        dataIndex: 'dstIP',
                        filter: { xtype: 'textfield', filterName: 'dstIP' }
                    },{
                        header: "Destination Port", width: 5,
                        dataIndex: 'dstPort',
                        filter: { xtype: 'cb.flowexpressionfilterfield', filterName: 'dstPort', filterPorts: true }
                    },
                    //these are hidden by default
                    {
                        header: "Source Object", hidden: true, sortable: false,
                        dataIndex: 'srcTargetID', renderer: Catbird.format.translateEndpoint,
                        filter: { xtype: 'textfield', filterName: 'srcTargetName' }
                    },{
                        header: "Destination Object", hidden: true, sortable: false,
                        dataIndex: 'dstTargetID', renderer: Catbird.format.translateEndpoint,
                        filter: { xtype: 'textfield', filterName: 'dstTargetName' }
                    },{
                        header: "Network Name", hidden: true, sortable: false,
                        dataIndex: 'srcIPAssetID', renderer: Catbird.format.makeAssetRenderer('portGroup', false, false)
                    },{
                        header: "Hypervisor", hidden: true, sortable: false,
                        dataIndex: 'srcIPAssetID', renderer: Catbird.format.makeAssetRenderer('hostSystemName', false, true)
                    },{
                        header: "VLAN ID", hidden: true,
                        dataIndex: 'vlanID',
                        filter: { xtype: 'textfield', filterName: 'vlanID' }
                    },{
                        header: "Packet Count", hidden: true, sortable: false,
                        dataIndex: 'count'
                    },{
                        header: "Byte Count", hidden: true, sortable: false,
                        dataIndex: 'bytes'
                    }
                ]
            }),

            listeners: {
                render: function() {
                    // there can be 100,000 pages on this grid if you make it tiny, so we need a wider input box
                    this.topToolbar.inputItem.setWidth(50);
                }
            }
        });

        // super
        Catbird.Insight.RawFlowGrid.superclass.initComponent.call(this);

    },
});

Ext.reg('cb.insight.rawflowgrid', Catbird.Insight.RawFlowGrid);

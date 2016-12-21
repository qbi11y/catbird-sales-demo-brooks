Catbird.Insight.FlowDetailsWindow = Ext.extend(Ext.Window, {
    autoHeight: true,
    modal: true,
    resizable: false,

    initComponent: function() {
        var d = this.d;
        var graph = this.graph;

        Ext.apply(this, {
            items: [{
                xtype: 'box',
                cls: 'x-plain',
                html: (
                    'Type: ' + graph.displayNames.edge[d.type] + '<br><br>' +
                    'Source: ' + graph.endpointMap[d.sourceID].name + '<br><br>' +
                    'Destination: ' + graph.endpointMap[d.destID].name + '<br><br>'
                )
            }, {
                xtype: 'grid',
                autoHeight: true,
                cm: new Ext.grid.ColumnModel([
                    new Ext.grid.RowNumberer(),
                    { header: 'Service', dataIndex: 'service' },
                    { header: 'Protocol', dataIndex: 'protocol' },
                    { header: 'Port', dataIndex: 'port' },
                    { header: 'Flow Count', dataIndex: 'count' },
                    { header: 'Traffic Size', dataIndex: 'size', renderer: function(v) { return v + ' MB'; }}
                ]),
                store: new Ext.data.JsonStore({
                    autoDestroy: true,
                    root: 'serviceDetails',
                    fields: [
                       'service',
                       'protocol',
                       'port',
                       'count',
                       'size',
                    ],
                    data: d
                })

            }]
        });

        Catbird.Insight.FlowDetailsWindow.superclass.initComponent.apply(this, arguments);
    }
});

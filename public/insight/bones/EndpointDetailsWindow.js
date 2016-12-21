Catbird.Insight.EndpointDetailsWindow = Ext.extend(Ext.Window, {
    autoHeight: true,
    modal: true,
    resizable: false,

    initComponent: function() {
        var d = this.d;
        var graph = this.graph;
        var tabPanel;

        function flowsGrid() {
            var services = {};
            var serviceList = [];
            var i;
            for(var i = 0; i < d.connectedEdges.length; i++) {
                var edge = d.connectedEdges[i];
                for(var j = 0; j < edge.serviceDetails.length; j++) {
                    var service = edge.serviceDetails[j];
                    var key = '-' + service.protocol + service.port;
                    if(key in services) {
                        services[key].count += service.count;
                        services[key].size += service.size;
                    }
                    else {
                        services[key] = Ext.apply({}, service);
                    }
                }
            }
            for(i in services) {
                serviceList.push(services[i]);
            }
            return {
                title: 'Flows',
                xtype: 'grid',
                autoHeight: true,
                cm: new Ext.grid.ColumnModel([
                    new Ext.grid.RowNumberer(),
                    { header: 'Service', dataIndex: 'service' },
                    { header: 'Protocol', dataIndex: 'protocol' },
                    { header: 'Port', dataIndex: 'port' },
                    { header: 'Flow Count', dataIndex: 'count' },
                    { header: 'Traffic Size', dataIndex: 'size', renderer: function(v) { return v + ' MB'; } }
                ]),
                store: new Ext.data.JsonStore({
                    autoDestroy: true,
                    root: 'services',
                    fields: [
                       'service',
                       'protocol',
                       'port',
                       'count',
                       'size',
                    ],
                    data: {services: serviceList}
                })
            };
        }


        if(d.type == "networkObject") {
            tabPanel = {
                xtype: 'tabpanel',
                height: 300,
                width: 500,
                activeItem: 0,
                items: [{
                    xtype: 'grid',
                    autoHeight: true,
                    title: 'Definition',
                    cm: new Ext.grid.ColumnModel([
                        new Ext.grid.RowNumberer(),
                        { header: 'Item', dataIndex: 'name' },
                    ]),
                    store: new Ext.data.JsonStore({
                        autoDestroy: true,
                        root: 'definition',
                        fields: [
                           'name',
                        ],
                        data: d
                    })
                },
                flowsGrid()
                ]
            };
        }
        else {
            tabPanel = {
                xtype: 'tabpanel',
                height: 300,
                width: 500,
                activeItem: 0,
                items: [{
                    title: 'Assets',
                    xtype: 'grid',
                    autoHeight: true,
                    cm: new Ext.grid.ColumnModel([
                        new Ext.grid.RowNumberer(),
                        { header: 'Asset Name', dataIndex: 'name' },
                        { header: 'IP', dataIndex: 'ip' },
                    ]),
                    store: new Ext.data.JsonStore({
                        autoDestroy: true,
                        root: 'assets',
                        fields: [
                           'name',
                           'ip',
                        ],
                        data: d
                    })
                },
                flowsGrid()
                ]
            };
        }

        Ext.apply(this, {
            items: [tabPanel]
        });

        Catbird.Insight.EndpointDetailsWindow.superclass.initComponent.apply(this, arguments);
    }
});

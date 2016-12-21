Catbird.Insight.TopologyFlowStore = Ext.extend(Catbird.Store, {
    remoteSort: true,
    reader: new Ext.data.JsonReader({
        root: 'flows',
        idProperty: 'flowID',
        successProperty: 'success'
    }, Catbird.Insight.TopologyFlowRecord),
    writer: new Ext.data.JsonWriter({
        encode: false,
        writeAllFields: false
    }),
    proxy: new Catbird.DirectProxy({
        api: {
            read: Catbird.ss.Insight.getTopologyFlowGrid
        }
    }),
    listeners: {
        beforeload: function (self, options) {
            console.log("TopologyFlowStore:beforeload limit=" + options.params.limit);
        },
        load: function (self, records, options){
            console.log("TopologyFlowStore:load limit=" + options.params.limit);
        }
        
    }
});

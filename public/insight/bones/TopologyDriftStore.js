Catbird.Insight.TopologyDriftStore = Ext.extend(Catbird.WhitelistEventStoreBase, {
    proxy: new Catbird.DirectProxy({
        api: {
            read: Catbird.ss.Whitelists.getDriftEventsForTopologyGrid
        }
    })
});

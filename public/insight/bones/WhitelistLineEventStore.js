Catbird.Insight.WhitelistLineEventStore = Ext.extend(Catbird.WhitelistEventStoreBase, {
    proxy: new Catbird.DirectProxy({
        api: {
            read: Catbird.ss.Whitelists.getDriftLineEventsGrid
        }
    })
});

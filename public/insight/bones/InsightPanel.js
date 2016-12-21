Catbird.Insight.InsightPanel = Ext.extend(Catbird.Tab, {
    layout: 'border',
    gridNeedsRefresh: true,
    driftMode: false,

    initComponent : function() {
        this.trackCreateWorkItemID = null;

        this.topologyFlowStore = new Catbird.Insight.TopologyFlowStore();
        this.topologyDriftStore = new Catbird.Insight.TopologyDriftStore();

        this.lastPing = new Date();

        function renewSession (){
            var now = new Date();
            if (now - this.lastPing > 100000) {   // 100 seconds; worst case error on our timeout.
                this.lastPing = now;
                Catbird.ss.Insight.sessionPing();
            }
        }

        Ext.apply(this, {
            afterRender: function() {
                Catbird.Insight.InsightPanel.superclass.afterRender.call(this);
                Catbird.ss.Insight.sessionPing();   // Renew session on render...
                this.getEl().on('click', renewSession, this);
                this.getEl().on('keypress', renewSession, this);
            },

            items: [{
                region: 'center',
                xtype: 'tabpanel',
                border: false,
                activeItem: 0,
                ref: 'centerContainer',
                autoScroll: true,
                enableTabScroll: true,
                items: [{
                    xtype: 'cb.insight.topologygraph',
                    ref: '../topologyGraph',
                    title: 'Aggregated Flow Graph',
                    tabTip: 'Aggregated Flow Graph',
                },{
                    xtype: 'cb.insight.topologyflowgrid',
                    ref: '../topologyGrid',
                    store: this.topologyFlowStore,
                    title: 'Aggregated Flow List',
                    tabTip: 'Aggregated Flow List',
                    listeners: {
                        scope: this,
                        activate: function() {
                            if(this.gridNeedsRefresh) {
                                this.gridNeedsRefresh = false;
                                this.topologyGrid.topToolbar.doRefresh();
                            }
                        }
                    }
                },{
                    xtype: 'cb.whitelisteventgrid',
                    ref: '../topologyDriftGrid',
                    store: this.topologyDriftStore,
                    id: 'insightDriftEventGrid',
                    title: 'Drift Event List',
                    tabTip: 'Drift Event List',
                    listeners: {
                        scope: this,
                        activate: function() {
                            if(this.gridNeedsRefresh) {
                                this.gridNeedsRefresh = false;
                                this.topologyDriftGrid.topToolbar.doRefresh();
                            }
                        }
                    }
                }],
                listeners: {
                    render: function() {
                        this.hideTabStripItem(this.ownerCt.topologyDriftGrid);
                    }
                }
            },{
                xtype: 'panel',
                ref: 'topologyFilterPanel',
                title: 'Topology Configuration',
                region: 'east',
                flex: true,
                width: 270,
                split: true,
                collapsible: true,
                collapseMode: 'mini',
                border: false,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                tbar: Catbird.featureFilter([{
                        feature: 'product.whitelist',
                        xtype: 'tbbutton',
                        text: 'Show Flows',
                        itemId: 'showFlowsButton',
                        scope: this,
                        handler: function (f) {
                            this.setDriftMode(false);
                        },
                        disabled: true
                    },
                    {
                        feature: 'product.whitelist',
                        xtype: 'tbseparator'
                    },
                    {
                        feature: 'product.whitelist',
                        xtype: 'tbbutton',
                        text: 'Show Drifts',
                        itemId: 'showDriftsButton',
                        scope: this,
                        handler: function (f) {
                            this.setDriftMode(true);
                        }
                    },
                    '->',
                    {
                        xtype: 'tbbutton',
                        text: 'Export Summary',
                        itemId: 'exportSummaryButton',
                        scope: this,
                        handler: function(f) {
                            if (this.driftMode) {
                                // This button shall be disabled in drift mode, but just in case:
                                Catbird.ErrorNotificationBar.showErrorMessage("Cannot perform 'Export Summary' in Drift mode.");
                                return false;
                            }
                            this.topologyGrid.openCSVExportDialog({ apiMethodName: 'exportTopologyFlowSummary' });
                    }
                }]),

                items: [{
                    xtype: 'panel',
                    border: false,
                    padding: 10,
                    items: [{
                        xtype: 'button',
                        scope: this,
                        text: 'Create Topology',
                        ref: '../../createTopologyButton',
                        height: 28,
                        width: 120,
                        handler: this.createTopology,
                    }],
                },{
                    xtype: 'cb.insight.endpointselectiongrid',
                    ref: 'endpointGrid',
                    flex: 2,
                    border: false,
                    title: 'Select Endpoints',
                    tbar: [{
                        xtype: 'tbbutton',
                        text: 'Clear Filters',
                        scope: this,
                        handler: function(f) {
                            this.topologyFilterPanel.endpointGrid.resetHeaderFilters(true);
                        }
                    },
                    '-',
                    {
                        xtype: 'tbbutton',
                        text: 'Clear Topology',
                        scope: this,
                        handler: function(f) {
                            this.clearTopology();
                        }
                    }]
                },{
                    title: 'Flow Filters',
                    xtype: 'cb.insight.filterselectionpanel',
                    ref: 'flowFilterPanel',
                    border: false,
                    region: 'north',
                    flex: 1,
                }]
            }]
        });
        Catbird.Insight.InsightPanel.superclass.initComponent.call(this);

        this.connection = this.createConnection();

        this.load();
    },

    clearTopology: function() {
        this.topologyFilterPanel.endpointGrid.selModel.clearSelections(true);
        this.topologyFilterPanel.endpointGrid.resetHeaderFilters(true);
        this.sortEndpointStore();
        Catbird.ss.Insight.clearTopology({}, function(data) {
            if(data && data.success) {
                this.trackCreateWorkItemID = data.workItemID;
                if(this.connection.lastTopologyProgressEvent) {
                    this.handleWorkItemProgress(this.connection.lastTopologyProgressEvent);
                }
            }
        }, this);

        this.markClean();
    },

    createTopology: function() {
        var endpoints = [];
        var selectedEndpoints = this.topologyFilterPanel.endpointGrid.selModel.getSelections();
        var i;
        for(i = 0; i < selectedEndpoints.length; i++) {
            var record = selectedEndpoints[i];
            endpoints.push({type: record.data.type, targetID: record.data.targetID});
        }
        this.sortEndpointStore();

        var filters = this.topologyFilterPanel.flowFilterPanel.filterValues;
        var params = Ext.apply({ endpoints: endpoints }, filters);

        this.topologyGraph.setCreationProgress({ percentComplete: 0, description: 'starting'});

        Catbird.ss.Insight.createTopology(params, function(data) {
            if(data && data.success) {
                this.trackCreateWorkItemID = data.workItemID;
                if(this.connection.lastTopologyProgressEvent) {
                    this.handleWorkItemProgress(this.connection.lastTopologyProgressEvent);
                }
            }
        }, this);

        this.markClean();
    },

    createConnection: function() {
        return new Catbird.Insight.SubscriptionWebsocketConnection({
            targets: [
                'WorkItemProgressEvent',
                'WorkItemStateChangeEvent',
                'ExpandTopologyWorkItem'
            ],

            listeners: {
                scope: this,
                subscribed: function(connection) {
                    this.topologyGraph.setSocketConnected(true);
                },

                notification: function(data, connection) {
                    // console.log(connection, data);
                    if(!this.topologyGraph) {
                        return;
                    }

                    if(data.type == "WorkItemProgressEvent") {
                        if(data.workItemType == "insight.CreateTopologyWorkItem") {
                            // there's a small window for us to get the progress notification before we know what work item ID we want to track
                            // so we store the last progress notification for when that happens - only one can be ran at a time anyway
                            connection.lastTopologyProgressEvent = data;
                            this.handleWorkItemProgress(data);
                        }
                    }
                    if(data.type == "WorkItemStateChangeEvent") {
                        if(["insight.CreateTopologyWorkItem", "insight.ClearTopologyWorkItem", "insight.RefreshTopologyWorkItem", "insight.ExpandTopologyWorkItem"].indexOf(data.workItemType) > -1) {
                            if(data.state == "assigned") {
                                this.topologyGraph.setServerRefreshing(true);
                            }
                            else if(data.state == "completed") {
                                this.topologyGraph.setServerRefreshing(false);
                                this.topologyGraph.refreshData(function(response) {
                                    if(!response|| !response.success || !response.session) {
                                        this.markDirty();
                                        this.createTopologyButton.setText('Create Topology');
                                    }
                                    else {
                                        this.createTopologyButton.setText('Update Topology');
                                    }
                                }, this);

                                this.gridNeedsRefresh = true;
                                if (this.centerContainer.activeTab === this.topologyGrid) {
                                    this.topologyFlowStore.load();
                                }
                            }
                            else if(data.state == "failed") {
                                this.topologyGraph.setServerRefreshing(false);
                            }
                        }
                    }
                },

                error: function(event, connection) {
                    if(window.console && Catbird.debugExceptions) {
                        console.warn("error", event);
                    }
                },

                close: function(event, connection) {
                    var reconnecting = connection.reconnecting;
                    var disconnectMsg = "Connection interrupted";
                    if(event.reason) {
                        disconnectMsg += ": " + event.reason;
                    }

                    this.topologyGraph.setSocketConnected(false, {
                        reconnecting: reconnecting,
                        disconnectMsg: disconnectMsg,
                        reconnectFn: function() {
                            connection.retries = 0;
                            connection.reconnecting = true;
                            connection.createWebSocket();
                        }
                    });
                },
            }
        });
    },

    handleWorkItemProgress: function(data) {
       if(data.workItemID != this.trackCreateWorkItemID) {
            return;
        }

        this.topologyGraph.setCreationProgress(data);
    },

    sortEndpointStore: function() {
            var endpointGrid = this.topologyFilterPanel.endpointGrid;
            var endpointStore = endpointGrid.store;
            var selectionModel = endpointGrid.getSelectionModel();
            var selections = selectionModel.getSelections();
            var selectedEndpointIDs = {};

            for(var i = 0; i < selections.length; i++) {
                selectedEndpointIDs[selections[i].id] = true;
            }

            // sort selected records to the top
            endpointStore.data.sort('ASC', function(a, b) {
                var aIn = (a.id in selectedEndpointIDs);
                var bIn = (b.id in selectedEndpointIDs);
                if(aIn && !bIn) return -1;
                if(!aIn && bIn) return 1;
                if(a.data.type == 'trustZone' && b.data.type != 'trustZone') return -1;
                if(a.data.type != 'trustZone' && b.data.type == 'trustZone') return 1;
                return d3.ascending(a.data.name, b.data.name);
            });
            endpointStore.fireEvent('datachanged', endpointStore);
    },

    load: function() {
        this.topologyGraph.refreshData(function(response) {
            if(!response || !response.success || !response.session) {
                return;
            }

            var endpointGrid = this.topologyFilterPanel.endpointGrid;
            var endpointStore = endpointGrid.store;
            var selectionModel = endpointGrid.getSelectionModel();

            var selectedEndpoints = [];
            var endpointsToSelect = [];
            for(var i = 0; i < response.endpoints.length; i++) {
                var endpoint = response.endpoints[i];
                var index;
                var recordID;
                if(endpoint.inTopology) {
                    recordID = endpoint.type + '-' + endpoint.id;
                    index = endpointStore.indexOfId(recordID);
                    if(index != -1) {
                        selectedEndpoints.push(index);
                    }
                    else {
                        endpointsToSelect.push(recordID);
                    }
                }
            }
            selectionModel.selectRows(selectedEndpoints);
            this.sortEndpointStore();

            if(endpointsToSelect.length) {
                this.mon(endpointStore, {
                    scope: this,
                    single: true,
                    datachanged: function(store) {
                        var changed = false;
                        for(var i = 0; i < endpointsToSelect.length; i++) {
                            var id = endpointsToSelect[i];
                            var record = store.getById(id);
                            if(record && !selectionModel.isIdSelected(id)) {
                                selectionModel.selectRecords([record], true);
                                changed = true;
                            }
                        }
                        if(changed) {
                            this.sortEndpointStore();
                        }
                    }
                });
            }

            this.topologyFilterPanel.flowFilterPanel.loadFilters(response.filters);

            this.markClean();
            this.createTopologyButton.setText('Update Topology');
        }, this);
    },

    addTab: function(tabConfig) {
        var tab = this.centerContainer.add(tabConfig);
        this.centerContainer.activate(tab);
    },

    getURLFragment: function() {
        return ["dashboard/network_topology", "Flows (Aggregated)"];
    },

    dirty: false,

    markDirty: function() {
        this.dirty = true;
        this.createTopologyButton.enable();
    },

    markClean: function() {
        this.dirty = false;
        this.createTopologyButton.disable();
        this.topologyFilterPanel.flowFilterPanel.applyFiltersButton.disable();
    },
    setDriftMode: function (shouldEnable) {
        this.driftMode = shouldEnable;
        this.centerContainer.setActiveTab(this.topologyGraph);  // make the "lens" the active tab
        if (shouldEnable) {
            this.topologyFilterPanel.getTopToolbar().get('showDriftsButton').disable();
            this.topologyFilterPanel.getTopToolbar().get('showFlowsButton').enable();
            this.centerContainer.hideTabStripItem(this.topologyGrid);
            this.centerContainer.unhideTabStripItem(this.topologyDriftGrid);
        }
        else {
            this.topologyFilterPanel.getTopToolbar().get('showDriftsButton').enable();
            this.topologyFilterPanel.getTopToolbar().get('showFlowsButton').disable();
            this.centerContainer.unhideTabStripItem(this.topologyGrid);
            this.centerContainer.hideTabStripItem(this.topologyDriftGrid);
        }
        this.topologyGraph.setDriftMode(shouldEnable);
        this.topologyFilterPanel.flowFilterPanel.setDriftMode(shouldEnable);
        this.topologyFilterPanel.getTopToolbar().get('exportSummaryButton').setDisabled(shouldEnable);
        // TODO: If we really must remove other tabs, this is the place to do it...
    }
});

Ext.reg('cb.insight.insightpanel', Catbird.Insight.InsightPanel);

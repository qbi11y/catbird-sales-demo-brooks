Catbird.Insight.EndpointSelectionGrid = Ext.extend(Catbird.Grid, {
    initComponent : function() {

        this.selModel = new Ext.grid.CheckboxSelectionModel({
            // override: always keep the existing rows when clicking on them (instead of requiring ctrl/shift)
            handleMouseDown : function(g, rowIndex, e) {
                if(e.button !== 0 || this.isLocked()){
                    return;
                }
                var view = this.grid.getView();
                if(e.shiftKey && !this.singleSelect && this.last !== false) {
                    var last = this.last;
                    this.selectRange(last, rowIndex, e.ctrlKey);
                    this.last = last; // reset the last
                    view.focusRow(rowIndex);
                } else {
                    var isSelected = this.isSelected(rowIndex);
                    if(isSelected){
                        this.deselectRow(rowIndex);
                    } else if(!isSelected || this.getCount() > 1) {
                        this.selectRow(rowIndex, true);
                        view.focusRow(rowIndex);
                    }
                }
            },
            listeners: {
                selectionChange: function() {
                    this.grid.refOwner.refOwner.markDirty();
                }
            }
        });

        var filterer = new Catbird.GridHeaderFilters({clientFilter: true});

        var typeMap = {
            'networkObject': 'Network Object',
            'trustZone': 'TrustZone'
        };

        Ext.apply(this, {
            plugins: [filterer],
            store: this.createStore(),
            view: new Catbird.FittedGridView({}),
            enableHdMenu: false,
            colModel: new Ext.grid.ColumnModel({
                columns: [
                    this.selModel,
                    {
                        header: 'Type', dataIndex: 'type',
                        width: 90, preventAutoResize: true,
                        renderer: Catbird.format.mapRenderer(typeMap),
                        filter: Catbird.filter.makeCheckboxFilter('type', typeMap)
                    },
                    {
                        header: 'Target', sortable: false, dataIndex: 'name',
                        renderer: 'htmlEncode',
                        filter: { xtype: 'textfield', filterName: 'name' }
                    }
                ]
            })
        });

        // super
        Catbird.Insight.EndpointSelectionGrid.superclass.initComponent.call(this);
    },

    createStore: function() {
        var recordCls = Ext.data.Record.create([
            'id',
            'type',
            'targetID'
        ]);
        var selModel = this.selModel;
        var combinedStore = new Catbird.Store({
            // override: never filter out selected rows
            createMultipleFilterFn: function(filters) {
                return function(record) {
                    if(selModel.isIdSelected(record.id)) {
                        return true;
                    }
                    var isMatch = true;

                    for (var i=0, j = filters.length; i < j; i++) {
                        var filter = filters[i],
                            fn     = filter.fn,
                            scope  = filter.scope;

                        isMatch = isMatch && fn.call(scope, record);
                    }

                    return isMatch;
                };
            }
        });


        function watchStore(parentStore, recordType) {
            function createRecord(parentRecord) {
                return new recordCls({
                    id: recordType + '-' + parentRecord.id,
                    targetID: parentRecord.id,
                    type: recordType,
                    name: parentRecord.data.name
                }, recordType + '-' + parentRecord.id);
            }

            var listeners = {
                scope: combinedStore,
                'add': function(store, records, index) {
                    for(var i = 0; i < records.length; i++) {
                        if(records[i].phantom) {
                            // don't add phantom records (they will be added in the update handler below)
                            continue;
                        }
                        combinedStore.add(createRecord(records[i]));
                    }
                },

                'update': function(store, parentRecord, operation) {
                    var combinedRecord = combinedStore.getById(recordType + '-' + parentRecord.id);
                    if(combinedRecord) {
                        switch(operation) {
                            case Ext.data.Record.EDIT:
                                combinedRecord.beginEdit();

                                for (var n in parentRecord.modified) {
                                    combinedRecord.set(n, parentRecord.get(n));
                                }
                                combinedRecord.endEdit();
                                break;

                            case Ext.data.Record.REJECT:
                                combinedRecord.reject();
                                break;

                            case Ext.data.Record.COMMIT:
                                combinedRecord.commit();
                                break;
                        }
                    }
                    else if(operation == Ext.data.Record.COMMIT) {
                        combinedStore.add(createRecord(parentRecord));
                    }
                },


                'remove': function(store, parentRecord, index) {
                    var record = combinedStore.getById(recordType + '-' + parentRecord.id);
                    if(record) {
                        combinedStore.remove(record);
                    }
                },

                'datachanged': function() {
                    combinedStore.suspendEvents(false);

                    var matchingRecords = [];
                    combinedStore.each(function(record) {
                        if(record.data.type == recordType) {
                            matchingRecords.push(record);
                        }
                    });
                    for(var i = 0; i < matchingRecords.length; i++) {
                        combinedStore.remove(matchingRecords[i]);
                    }

                    parentStore.each(function(record) {
                        combinedStore.add(createRecord(record));
                    });

                    combinedStore.resumeEvents();
                    combinedStore.fireEvent('datachanged', combinedStore);
                }
            };

            listeners.datachanged(parentStore);
            parentStore.on(listeners);
        }

        watchStore(zoneStore, 'trustZone');
        watchStore(networkObjectStore, 'networkObject');

        return combinedStore;
    }
});

Ext.reg('cb.insight.endpointselectiongrid', Catbird.Insight.EndpointSelectionGrid);

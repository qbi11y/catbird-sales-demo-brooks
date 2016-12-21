Catbird.Insight.FilterSelectionPanel = Ext.extend(Ext.grid.EditorGridPanel, {
    initComponent: function() {
        var grid = this;
        this.driftMode = false;

        function applyFilter(filter) {
            grid.applyFilter(filter);
        }


        this.defineFilterTypes(this.driftMode);


        this.store = new Ext.data.JsonStore({
            autoDestroy: true,
            fields: [
               'filterType',
               'value'
            ],
        });

        getDateOneWeekAgo = function() {
            oneWeekAgo = Catbird.format.convertToLocal(new Date());
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return oneWeekAgo;
        };

        this.setDefaultFilters = function() {
            this.filterValues = {
                'beginTimeStartDate': getDateOneWeekAgo()
            };
        };

        this.addDefaultStores = function() {
            this.store.add(new this.store.recordType({'filterType': 'beginTime', 'value': ''}, Ext.id()));
        };

        // initialize with a destination port filter and date range (if there's an existing topology this will be cleared)
        this.setDefaultFilters();
        this.addDefaultStores();

        this.createFilterTypeMenu();

        Ext.apply(this, {
            clicksToEdit: 1,
            tbar: [
                {
                    text: 'Add Filter',
                    scope: this,
                    menu: this.filterTypeMenu
                },
                '-',
                {
                    text: 'Remove Filter',
                    itemId: 'deleteButton',
                    disabled: true,
                    scope: this,
                    handler: this.removeFilterHandler
                },
                '-',
                {
                    text: 'Apply',
                    ref: '../applyFiltersButton',
                    disabled: true,
                    scope: this,
                    handler: function() {
                        var insightPanel = this.getInsightPanel();
                        insightPanel.createTopology.call(insightPanel);
                    }
                },
                '-',
                {
                    text: 'Reset Filters',
                    itemId: 'resetFiltersButton',
                    disabled: false,
                    scope: this,
                    handler: this.resetFiltersHandler
                },
            ],

            view: new Catbird.FittedGridView({
                markDirty: false,
                emptyText: 'No filters specified.<br>All flows will be included.'
            }),

            selModel: new Ext.grid.RowSelectionModel({}),
            enableHdMenu: false,
            colModel: new Ext.grid.ColumnModel({
                columns: [{
                        header: 'Filter', dataIndex: 'filterType',
                        width: 100, preventAutoResize: true, sortable: false, editable: false,
                        renderer: function(value) {
                            return grid.filterTypes[value].name;
                        }
                    },{
                        header: 'Value', sortable: false, dataIndex: 'value', editable: true,
                        renderer: function(value, p, record) {
                            var renderer = grid.filterTypes[record.data.filterType].renderer;
                            if(!renderer) {
                                renderer = Ext.util.Format.htmlEncode;
                            }
                            return renderer(value, p, record);
                        }
                    }
                ]
            })
        });
        // super
        Catbird.Insight.FilterSelectionPanel.superclass.initComponent.call(this);

        this.on({
            scope: this,
            beforeedit: this.handleBeforeEdit,
            afteredit: this.handleAfterEdit
        });

        this.mon(this.selModel, 'selectionchange', this.onSelectionChange, this);
    },

    defineFilterTypes: function(driftMode) {
        var grid = this;


        function applyFilter(filter) {
            grid.applyFilter(filter);
        }

        function makeArrayRenderer(renderer) {
            return function(value, p, record) {
                if(Ext.isArray(value)) {
                    var ret = [];
                    for(var i = 0; i < value.length; i++) {
                        ret.push(renderer(value[i], p, record));
                    }
                    return ret.join(', ');
                }
                return renderer(value, p, record);
            };
        }

        function portRenderer(filterName) {
            return function(value) {
                var t = grid.filterValues[filterName + 'Type'];
                var v = grid.filterValues[filterName + 'Value'];
                var typeMap = {
                    '': '',
                    '==': 'Equal To',
                    '>=': 'At Least',
                    '<=': 'At Most',
                    '>': 'Greater Than',
                    '<': 'Less Than'
                };

                if(t === undefined || v === undefined) {
                    return '';
                }

                if(t == '<' && v == '49152') {
                    return "Service Ports";
                }
                return typeMap[t] + ' ' + v;
            };
        }
        this.filterTypes = {
            'drifttype': {
                name: 'Drift Type',
                renderer: makeArrayRenderer(Catbird.format.mapRenderer(Catbird.format.driftTypeMap)),
                filter: Catbird.filter.makeCheckboxFilter('driftType', Catbird.format.driftTypeMap),
                showDrift: true,
                showFlow: false,
                recreate: false
            },
            'remoteip': {
                name: 'IP Space Address',
                filter: { xtype: 'textfield', filterName: 'remoteip' },
                showDrift: true,
                showFlow: false,
                recreate: false
            },
            'flowType': {
                name: 'Flow Type',
                renderer: makeArrayRenderer(Catbird.format.mapRenderer(Catbird.format.flowTypeMap)),
                filter: Catbird.filter.makeCheckboxFilter('flowType', Catbird.format.getEnabledFlowTypes()),
                showDrift: false,
                showFlow: true,
                recreate: true
            },
            'srcIP': {
                name: 'Source IP',
                filter: { xtype: 'textfield', filterName: 'srcIP' },
                showDrift: false,
                showFlow: true,
                recreate: true
            },
            'dstIP': {
                name: 'Destination IP',
                filter: { xtype: 'textfield', filterName: 'dstIP' },
                showDrift: false,
                showFlow: true,
                recreate: true
            },
            'srcIPAssetName': {
                name: 'Source Asset',
                filter: { xtype: 'textfield', filterName: 'srcIPAssetName' },
                showDrift: false,
                showFlow: true,
                recreate: true
            },
            'dstIPAssetName': {
                name: 'Destination Asset',
                filter: { xtype: 'textfield', filterName: 'dstIPAssetName' },
                showDrift: false,
                showFlow: true,
                recreate: true
            },
            'beginTime': {
                name: 'Time',
                extraFilterKeys: ['beginTimeStartDate', 'beginTimeStartTime', 'beginTimeEndDate', 'beginTimeEndTime'],
                renderer: function(v) {
                    var startValue = grid.filterValues['beginTimeStartDate'];
                    var endValue = grid.filterValues['beginTimeEndDate'];
                    var value = '',
                        startValueName = '',
                        endValueName = '';

                    if(startValue) {
                        startValue = Catbird.format.parseDate(startValue);
                        startValueName = startValue.format('Y-m-d');
                    }
                    if(endValue) {
                        endValue = Catbird.format.parseDate(endValue);
                        endValueName = endValue.format('Y-m-d');
                    }
                    if(startValue && endValue) {
                        if(startValueName == endValueName) {
                            value = 'On ' + startValueName;
                        }
                        else {
                            value = 'From ' + startValueName + ' to ' + endValueName;
                        }
                    }
                    else if(startValue)
                        value = 'After ' + startValueName;
                    else if(endValue)
                        value = 'Before ' + endValueName;

                    return value;
                },
                filter: {
                    xtype: 'cb.daterangefilterfield',
                    fieldName: 'beginTime',
                    filterName: 'beginTime',
                    applyFilter: applyFilter,
                    isValid: function() { return true; }
                },
                showDrift: true,
                showFlow: true,
                recreate: true
            },
            'protocol': {
                name: 'Protocol',
                renderer: makeArrayRenderer(Catbird.format.mapRenderer(Catbird.format.flowProtocolMap)),
                filter: Catbird.filter.makeCheckboxFilter('protocol', Catbird.format.flowProtocolMap),
                showDrift: true,
                showFlow: true,
                recreate: true
            },
            'dstPort': {
                name: 'Destination Port',
                extraFilterKeys: ['dstPortType', 'dstPortValue'],
                renderer: portRenderer('dstPort'),
                filter: {
                    xtype: 'cb.flowexpressionfilterfield',
                    filterName: 'dstPort',
                    applyFilter: applyFilter,
                    isValid: function() { return true; }
                },
                showDrift: true,
                showFlow: true,
                recreate: true
            }

        };
        this.updateFilterOptions();
    },

    updateFilterOptions: function() {
        var filterPanel = this;
        this.filterOptions = []
        for(aType in this.filterTypes){
            if((this.driftMode && this.filterTypes[aType].showDrift) || (!this.driftMode && this.filterTypes[aType].showFlow)){
                this.filterOptions.push(aType);
            }
        };
        this.filterOptions.sort(function(a, b) {
            return d3.ascending(filterPanel.filterTypes[a].name, filterPanel.filterTypes[b].name);
        });
    },

    createFilterTypeMenu: function() {
        var items = [];
        for(var i = 0; i <  this.filterOptions.length; i++) {
            var filterType = this.filterOptions[i];

            items.push({
                filterType: filterType,
                text: this.filterTypes[filterType].name,
                handler: this.addFilter,
                scope: this
            });
        }

        this.filterTypeMenu = Ext.create({
            xtype: 'menu',
            items: items
        });

        this.updateFilterTypeMenu();
    },

    updateFilterTypeMenu: function() {
        var selectedFilterTypes = {};
        var i;
        for(i = 0; i < this.store.data.items.length; i++) {
            var filterType = this.store.data.items[i].data.filterType;
            selectedFilterTypes[filterType] = true;
        }
        this.filterTypeMenu.items.each(function(item) {
            item.setDisabled(item.filterType in selectedFilterTypes);
        });
    },

    addFilter: function(button) {
        var filterType = button.filterType;

        this.store.add(new this.store.recordType({'filterType': filterType, 'value': ''}, Ext.id()));
        this.updateFilterTypeMenu();
        this.onFiltersChanged();
    },

    handleBeforeEdit: function(e) {
        var column = e.grid.colModel.getColumnAt(e.column);
        var editor;
        var filterType = e.record.data.filterType;

        editor = Ext.apply({}, this.filterTypes[filterType].filter);

        if(filterType == 'dstPort') {
            var initialValue = {
                type: this.filterValues[filterType + 'Type'],
                value: this.filterValues[filterType + 'Value'],
            };
            if(initialValue.type && initialValue.value) {
                editor.initialValue = initialValue;
            }
        }
        if(filterType == 'beginTime') {
            editor.initialValue = {};
            var startDate = this.filterValues[filterType + 'StartDate'];
            var endDate = this.filterValues[filterType + 'EndDate'];
            if(startDate) {
                startDate = Catbird.format.parseDate(startDate);
                editor.initialValue.startDate = startDate;
                editor.initialValue.startTime = startDate.format('H:i:s');
            }
            if(endDate) {
                endDate = Catbird.format.parseDate(endDate);
                editor.initialValue.endDate = endDate;
                editor.initialValue.endTime = endDate.format('H:i:s');
            }
        }
        column.setEditor(editor);
    },

    handleAfterEdit: function(e) {
        var editor = e.grid.colModel.getColumnAt(e.column).editor;
        this.applyFilter(editor);
    },

    applyFilter: function(filter) {
        if(!filter.isValid() || filter.applyFilter)
            return;

        var value = filter.getValue();
        if(filter.disabled || Ext.isEmpty(value)) {
            delete this.filterValues[filter.filterName];
        }
        else {
            this.filterValues[filter.filterName] = value;
        }
        this.onFiltersChanged();
    },

    removeFilterHandler: function() {
        var selections = this.selModel.getSelections();
        for(var s = 0; s < selections.length; s++) {
            var selectedRecord = selections[s];
            var filterType = this.filterTypes[selectedRecord.data.filterType];

            delete this.filterValues[filterType.filter.filterName];
            if(filterType.extraFilterKeys) {
                for(var i = 0; i < filterType.extraFilterKeys.length; i++) {
                    delete this.filterValues[filterType.extraFilterKeys[i]];
                }
            }

            this.store.remove(selectedRecord);
        }
        this.updateFilterTypeMenu();
        this.onFiltersChanged();
    },

    getInsightPanel: function() {
        return this.ownerCt.ownerCt;
    },

    onFiltersChanged: function() {
        this.getInsightPanel().markDirty();
        this.applyFiltersButton.enable();
    },

    resetFiltersHandler: function() {
        this.store.removeAll();
        this.setDefaultFilters();
        this.addDefaultStores();
        this.updateFilterTypeMenu();
        this.onFiltersChanged();
    },

    onSelectionChange: function(selModel) {
        var toolbar = this.getTopToolbar();
        if(selModel.getCount()) {
            toolbar.get('deleteButton').enable();
        }
        else {
            toolbar.get('deleteButton').disable();
        }
    },

    loadFilters: function(filters) {
        this.store.removeAll();
        this.filterValues = {};

        for(var k in filters) {
            if(k in this.filterTypes) {
                var value = filters[k];
                if(k == 'dstPort') {
                    if(value.type && value.value) {
                        this.filterValues[k + 'Type'] = value.type;
                        this.filterValues[k + 'Value'] = value.value;
                        this.store.add(new this.store.recordType({'filterType': k, 'value': ''}, Ext.id()));
                    }
                }
                else if(k == 'beginTime') {
                    if(value.start) {
                        this.filterValues[k + 'StartDate'] = value.start;
                    }
                    if(value.end) {
                        this.filterValues[k + 'EndDate'] = value.end;
                    }
                    if(value.start || value.end) {
                        this.store.add(new this.store.recordType({'filterType': k, 'value': ''}, Ext.id()));
                    }
                }
                else if(filters[k]) {
                    this.filterValues[k] = value;
                    this.store.add(new this.store.recordType({'filterType': k, 'value': value}, Ext.id()));
                }
            }
        }
        this.updateFilterTypeMenu();
    },
    setDriftMode: function (shouldEnable) {
        // Ok, the user has switched to/from "drift mode".  The menus are not compatible,
        // so recreate them.
        this.driftMode = shouldEnable;

        this.filterTypeMenu.removeAll();
        this.updateFilterOptions()
        for(var i = 0; i <  this.filterOptions.length; i++) {
            var filterType = this.filterOptions[i];
            this.filterTypeMenu.add(Ext.create({
                xtype: 'menuitem',
                filterType: filterType,
                text: this.filterTypes[filterType].name,
                handler: this.addFilter,
                scope: this
            }));
        }

        // TODO: As an optimization, we should only recreate the topology if the filter change requires it.
        var insightPanel = this.getInsightPanel();
        insightPanel.createTopology.call(insightPanel); // the filters changed, so the topology needs to correspond.
    }
});

Ext.reg('cb.insight.filterselectionpanel', Catbird.Insight.FilterSelectionPanel);

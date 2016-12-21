Catbird.Charts.D3Chart = Ext.extend(Ext.BoxComponent, {
    autoEl: {
        tag: 'div',
        cls: 'x-panel-body d3-root',
        children: [
            {
                tag: 'div',
                cls: 'd3-loading',
                style: 'width: 100%; height: 100%; display: none',
                children: [{
                    tag: 'img',
                    height: 128,
                    width: 128,
                    style: 'position: absolute; display: block; left: 50%; top: 50%; margin-top: -64px; margin-left: -64px;',
                    src: Catbird.appRoot + 'loading_large.gif'
                }]
            }, {
                tag: 'div',
                cls: 'd3-chart',
            }
        ]
    },

    data: null,
    loadingIndicator: true,
    loadFn: null,
    filterState: null,

    resizable: true,

    chartWidth: 300,
    chartHeight: 300,
    minWidth: 20,
    minHeight: 20,

    chartMargins: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
    },

    chartInitialized: false,

    initComponent: function() {
        this.filterState = {};

        Catbird.Charts.D3Chart.superclass.initComponent.call(this);
        if(this.loadFn) {
            this.loadFn(this.filterState, function(data) {
                if(data && data.success) {
                    this.loadData(data.rows, data);
                }
            }, this);
        }
    },

    // Sets up the top-level chart element once extjs is ready
    afterRender: function() {
        Catbird.Charts.D3Chart.superclass.afterRender.call(this);
        this.chartEl = this.el.down('.d3-chart', true);
        this.loadingEl = this.el.down('.d3-loading', true);

        var outerWidth = this.chartWidth + this.chartMargins.left + this.chartMargins.right;
        var outerHeight = this.chartHeight + this.chartMargins.top + this.chartMargins.bottom;

        this.root = d3.select(this.chartEl).append('svg:svg')
            .attr('width', outerWidth)
            .attr('height', outerHeight);

        this.chart = this.root.append("g")
            .attr("transform", "translate(" + this.chartMargins.left + "," + this.chartMargins.top + ")");

        this.el.setSize(outerWidth, outerHeight);
        this.renderChart();

    },

    // loads or replaces the data being charted
    loadData: function(data) {
        this.data = data;
        this.renderChart();
    },

    showLoadingIndicator: function() {
        if(this.loadingEl) {
            this.loadingEl.style.display = 'block';
            this.chartEl.style.display = 'none';
        }
    },

    hideLoadingIndicator: function() {
        if(this.loadingEl) {
            this.loadingEl.style.display = 'none';
            this.chartEl.style.display = 'block';
        }
    },

    // Once the chart has both data and an element, this initializes and updates it
    renderChart: function() {
        if(this.chart && this.data) {
            if(!this.chartInitialized) {
                if(this.loadingIndicator) {
                   this.hideLoadingIndicator();
                }
                this.initChart();
                this.chartInitialized = true;
                this.updateChart(0);
            }
            else {
                this.updateChart();
            }
        }
        else {
            if(this.loadingIndicator) {
                this.showLoadingIndicator();
            }
        }
    },

    onResize: function(width, height) {
        if(this.resizable) {
            var innerWidth = width - this.chartMargins.left - this.chartMargins.right;
            var innerHeight = height - this.chartMargins.top - this.chartMargins.bottom;
            if(innerWidth < this.minWidth || innerHeight < this.minHeight) {
                // Don't let it resize to *too* small
                return;
            }

            this.chartWidth = innerWidth;
            this.chartHeight = innerHeight;
            this.root.attr({
                width: width,
                height: height,
            });

            if(this.chartInitialized) {
                this.resizeChart();
            }
        }
    },

    // d3 gives you lots of reasons to make functions to get this field from an element
    getter: function(key) {
        return function(item) {
            return item[key];
        };
    },


    // Overridden for each chart with whatever init it needs
    initChart: function() {},

    // Overridden for each chart with whatever d3 code it needs
    updateChart: function() {},

    // Overridden for each chart with whatever resize code it needs
    resizeChart: function() {}

});

Ext.reg('cb.d3chart', Catbird.Charts.D3Chart);

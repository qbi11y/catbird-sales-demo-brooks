Catbird.Insight.BaseWebsocketConnection = Ext.extend(Ext.util.Observable, {
    urlPath: '/',
    subprotocols: '',

    constructor: function(config) {
        this.listeners = config.listeners;
        this.addEvents(
            'open',
            'close',
            'error'
        );

        Catbird.Insight.BaseWebsocketConnection.superclass.constructor.call(this, config);

        this.connected = false;
        this.tid = 0;
        this.callbacks = {};
        this.createWebSocket();
    },

    createWebSocket: function() {
        var connection = this;
        connection.connected = false;

        var url = "wss://" + window.location.host + this.urlPath + "?csrf_token=" + encodeURIComponent(Catbird.state.csrfToken);
        var websocket = new WebSocket(url, this.subprotocols);

        websocket.onopen = function(event) {
            connection.connected = true;
            connection.onOpen(event);
        };

        websocket.onmessage = function(event) {
            connection.onMessage(event);
        };

        websocket.onclose = function(event) {
            connection.connected = false;
            connection.onClose(event);
        };

        websocket.onerror = function(event) {
            connection.connected = false;
            connection.onError(event);
        };

        this.websocket = websocket;
    },

    sendCommand: function(command, data, callback, scope) {
        var tid = this.tid++;
        var msg = JSON.stringify({
            command: command,
            tid: tid,
            data: data
        });

        if(callback) {
            this.callbacks[tid] = {fn: callback, scope: scope || this};
        }

        this.websocket.send(msg);
    },

    onOpen: function(event) {
        this.handleOpen(event);
        this.fireEvent('open', event, this);
    },
    onMessage: function(event) {
        var result = JSON.parse(event.data);
        if(result.type == "response") {
            var tid = result.tid;
            var callback = this.callbacks[tid];
            delete this.callbacks[tid];

            callback.fn.apply(callback.scope, result.data);
        }
        else {
            this.handleMessage(result.type, result.data);
        }
    },

    onClose: function(event) {
        this.handleClose(event);
        this.fireEvent('close', event, this);
    },

    onError: function(event) {
        this.handleError(event);
        this.fireEvent('error', event, this);
    },

    handleOpen: function() {},
    handleMessage: function(type, data) {},
    handleClose: function() {},
    handleError: function() {}
});

Catbird.Insight.SubscriptionWebsocketConnection = Ext.extend(Catbird.Insight.BaseWebsocketConnection, {
    urlPath: '/streamed',
    subprotocols: 'catbird-notification-v1',
    targets: null,
    maxRetries: 10,

    constructor: function(config) {
        Catbird.Insight.SubscriptionWebsocketConnection.superclass.constructor.call(this, config);

        this.addEvents(
            'subscribed',
            'notification'
        );

        Ext.apply(this, config);
        this.retries = 0;
    },

    handleOpen: function() {
        if(this.targets) {
            this.subscribe(this.targets, function() {
                this.fireEvent('subscribed', this);
            }, this);
        }
    },

    handleClose: function(event) {
        if(this.retries < this.maxRetries) {
            this.retries += 1;

            this.reconnecting = false;

            // for the first few attempts, reconnect immediately, then start backing off
            // unless it was the "new session created" disconnect, in which case wait for manual reconnect
            if(event.reason && event.reason == "This session has created a new connection") {
                this.reconnecting = false;
            }
            else if(this.retries < 5) {
                this.reconnecting = true;
                this.createWebSocket();
            }
            else {
                var connection = this;
                window.setTimeout(function() { connection.createWebSocket(); }, 1000 * this.retries);
            }
        }
    },

    handleMessage: function(type, data) {
        if(type == "notification") {
            this.fireEvent('notification', data, this);
        }
    },

    subscribe: function(targets, callback) {
        this.sendCommand("subscribe", {targets: targets}, callback);
    }
});

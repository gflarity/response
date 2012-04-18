var net = require('net');

//sends some heartbeat metrics

module.exports.FakeNervous = function( host, port, interval ) {
    
    var that = this;
    //create tcp connection
    this.tcp_connection = net.createConnection(port, host, function() {
        
        var send_heartbeat = function() {
            
            var now = new Date().getTime();
            that.tcp_connection.write( 'nervous.heartbeat 1 ' + now + '\n' );
        };
        
        that.interval_id = setInterval( send_heartbeat, interval );
        
        
    });
    
};

module.exports.FakeNervous.prototype.destroy = function() {
        debugger;
        this.tcp_connection.destroy();
        clearInterval( this.interval_id );
};

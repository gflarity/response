
module.exports.FakeNervous = function( host, port, interval ) {
    
    var that = thist;
    //create tcp connection
    this.tcp_connection = net.createConnection(port, host, function() {
        
        var send_heartbeat = function() {
            
            var now = new Date().getTimestamp();
            that.tcp_connection.write( 'nervous.heartbeat 1 ' + now + '\n' );
        };
        setInterval( send_heartheart, interval );
        
        
    });
    
};

module.exports.FakeNervous.prototype.close = function() {
        this.tcp_connection.destroy();
};

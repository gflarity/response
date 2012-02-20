var net = require('net');
var util = require('util');

var EventEmitter2 = require('eventemitter2').EventEmitter2;

var GraphiteEventEmitter = function( listen_host, listen_port ) {
    
    var that = this;
    
    
    this.listen_host = listen_host;
    this.listen_port = listen_port;

    //call super
    EventEmitter2.call(this, {    
        wildcard: true, 
        maxListeners: 0, //infinite listeners
    });
    
    var read_buffers_by_connection = {};
    
    //TODO fix this hack, we're not really keeping proper track of our connections
    that.connections = [];
    
    var on_connect = function(tcp_connection) { 
            
        that.connections.push( tcp_connection );
        
        read_buffers_by_connection[tcp_connection] = '';
        
        //setup our handlers for this connection

        //data
        var on_data = function( data ) {
   
            
            var read_buffer = read_buffers_by_connection[tcp_connection];
            read_buffer += data;

            //split by new lines, 
            var messages = read_buffer.split('\n');
            
            //last element is either a partial message, or ''            
            read_buffer = messages.pop();
        
            for ( var i = 0; i < messages.length; i++ ) {
                
                //TODO error handling
                var message = messages[i];
                var components = message.split( ' ' );
                var path = components[0];
                var value = components[1];
                var timestamp = components[2];
                
                that.emit(  path, value, timestamp );                
            }            
        };
        tcp_connection.on( 'data', on_data );
        
            
        //end event
        var on_end = function( ) {
            tcp_connection.destroy();          
        };
        tcp_connection.on( 'end', on_end );
        
        //error event
        var on_error = function() {
            tcp_connection.destroy();          
        };
        tcp_connection.on( 'error', on_error );
        
        //close
        var on_close = function() {
            
            //clean up
            delete read_buffers_by_connection[tcp_connection];
        };
        tcp_connection.on( 'close', on_close );
    };
        
    this.server = net.createServer( on_connect );
    this.server.listen( listen_port, listen_host );    
};
module.exports.GraphiteEventEmitter = GraphiteEventEmitter
util.inherits( GraphiteEventEmitter, EventEmitter2 );


GraphiteEventEmitter.prototype.destroy = function() {
    
    debugger;
    
    if ( this.server ) {
        this.server.close(); 
        delete this.server;
    }

    for ( var i = 0; i < this.connections.length; i++ ) {        
        this.connections[i].destroy();
    }
    
     //remove all listeners, no refugees please
    this.removeAllListeners();
    
}

var GraphiteEventProxy = function( graphite_event_emitter, graphite_host, graphite_port ) {

    var that = this;    
    
    that.host = graphite_host;
    that.port = graphite_port;
    
    that.connected = false;
    that.tcp_connection = new net.Socket();
    
    //TODO eventually this could get big if we can't send them out for a while
    that.message_buffer = [];

    //on connect we need to check if we have any messages in the
    //the message buffer, send them if so but first send a new
    //connect message
    var on_connect = function() {
    
        that.connected = true;
        that.tcp_connection.setKeepAlive( true );	
        
        if ( that.message_buffer.length ) {
            while( that.message_buffer.length ) {
                that.tcp_connection.write( that.message_buffer.shift() );
            }
        }
    };
    that.tcp_connection.on( 'connect', on_connect );

    var on_error = function( error ){
        
        //TODO figure out logging
        //log.error( 'graphite connection error: ' + error );
        
        //destroy the connection so that reconnect fires
        that.tcp_connection.destroy();
        that.connected = false;
    };
    that.tcp_connection.on( 'error', on_error );

    var on_close = function( ) {
	
        that.connected = false;
	    //TODO create an end message
	    //log that we ended
        //log.info( 'disconnected from graphite, reconnecting in 10000 ms' );
        
	    //reconnect after 10000 ms
        setTimeout( function () { 
            //need to reset the listeners?
            that.tcp_connection.connect( that.port, that.host );            
        }, 10000 );
        
    };
    that.tcp_connection.on( 'close', on_close );

    var on_any = function( value, timestamp ) {
    
        var path = this.event;

        var message = path + ' ' + value + ' ' + timestamp + '\n';
 
        if ( that.connected ) {
            that.tcp_connection.write( message );   
        }
        else {
            that.message_buffer.push( message );    
        }
    };
    graphite_event_emitter.onAny( on_any );
    
    //connectw
    that.tcp_connection.connect(that.port, that.host)
    
};
module.exports.GraphiteEventProxy = GraphiteEventProxy;

GraphiteEventProxy.prototype.destroy = function() {
    
    //disconnect
    debugger;
    this.tcp_connection.destroy();
    
};

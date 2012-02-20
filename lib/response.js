var fs = require('fs');
var path = require('path');
var graphite = require('./graphite');
var EventEmitter2 = require('eventemitter2').EventEmitter2;



var Response = function( config ) {

    /*process.on('uncaughtException', function (err) {
        console.log('Caught exception: ' + err);
        //if we have an uncaught exception, who knows what the state looks like, bail!
        process.exit(1);
    });*/


    var that = this;

    //create response dispatcher, plugins can communicate through this
    this.dispatch_emitter = new EventEmitter2({
          wildcard: true, 
          maxListeners: 0, //infinite listeners
        });
        
    var listen_host = config.graphite_proxy.listen_host;
    var listen_port = config.graphite_proxy.listen_port;
    
    var graphite_host = config.graphite_proxy.graphite_host;
    var graphite_port = config.graphite_proxy.graphite_port;
    
    //this pretends to be a graphite server, emitting events for each message
    //it inherits from EventEmitter2 and namespaces use periods just like 
    //graphite
    this.graphite_emitter = new graphite.GraphiteEventEmitter( listen_host, listen_port );
    
    //this takes a GraphiteEventEmitter, subscribes to all events and sends sends them off to Graphite
    //it can also buffer messages should graphite go down
    this.proxy = new graphite.GraphiteEventProxy( this.graphite_emitter, graphite_host, graphite_port );
    
    this.plugin_path = config.plugin_path;
    
    //plugins could except, but we still want to full our proxy duties
    try { 
        this.load_plugins();        
    } catch( e ) {
        console.log( e );
    };

};
module.exports.Response = Response;

Response.prototype.load_plugins = function () {
    
    var that = this;
    
    var full_plugins_path = path.join( this.plugin_path, 'node_modules' );
   
    
    fs.readdir( full_plugins_path, function( err, entries ) {

        var dirs = [];
        entries = entries || [];
	    entries.forEach( function( entry ) {
		    
		    var plugin = full_plugins_path + '/' + entry;
		    fs.stat( plugin, function( err, stats ) {
			    if ( stats.isDirectory() ) {
				require( plugin )( that.graphite_emitter, that.dispatch_emitter );
			    }
			} );	
	    } );
	    

	}

	);
};


Response.prototype.destroy = function() {
    
    debugger;
    
    this.graphite_emitter.destroy();
    this.proxy.destroy();

    //remove all the listeners, no stranded references please
    this.dispatch_emitter.removeAllListeners();
    
}
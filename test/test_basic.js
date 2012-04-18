var test = require('tap').test;
var net = require('net');

/* to reproduce test conditions for debugging simply run:

./fake_graphite &
./response ./test_basic_plugins &
./fake_nervous 

( use 'jobs', 'fg',  to kill them backgrounded process after );
*/
var child_process = require('child_process');

test( "proxy", function( t ) {

    //start fake_graphite child
    var fake_graphite =  child_process.spawn('./fake_graphite' );
    var on_fake_graphite_crash = function( code ) { 
        
         t.ok(false, "fake_graphite crashed!?");
         t.end();
    };
    fake_graphite.on( 'exit', on_fake_graphite_crash );
    
    var heartbeats_received = 0;
    var graphite_stdout_buffer;
    fake_graphite.stdout.on('data', function (data) {
         graphite_stdout_buffer += data;
         if (  graphite_stdout_buffer.indexOf('\n') !== -1  ) {
                if (  graphite_stdout_buffer.match( /heartbeat received/ ) ) {
                    heartbeats_received++;    
                    //console.log( "heartbeat received" );
                }
                graphite_stdout_buffer = '';
         }
    });
    process.on( 'uncaughtException', function(err) {  console.log(err); fake_graphite.removeAllListeners( 'exit' ); fake_graphite.kill(); } ); 

    //start response child
    var plugin_fires = 0;
    var response = child_process.spawn('./response', [ './basic_test_plugins' ] );
    var response_stdout_buffer = '';
    response.stdout.on('data', function (data) {
        response_stdout_buffer += data;
        if ( response_stdout_buffer.indexOf('\n') !== -1  ) {
            
            if ( response_stdout_buffer.match( /OH NOES!/ ) ) {
                plugin_fires++;  
                //console.log( 'plugin_fired' );
            }
            nervous_stdout_buffer = '';
        }                
        
    });
    
    
    process.on( 'uncaughtException', function(err) {  console.log(err); response.removeAllListeners( 'exit' ); response.kill() } ); 
    

    var on_response_crash = function( code ) { 
        
         t.ok(false, "response crashed!?");
         t.end();
    };
    response.on( 'exit', on_response_crash );

    //give server some time to start
    setTimeout( function() {
        var fake_nervous = child_process.spawn( './fake_nervous' );
        var on_fake_nervous_crash = function( code ) {
             t.ok(false, "fake_nervous crashed!?");
             t.end();    
            
        };
        fake_nervous.on( 'exit', on_fake_nervous_crash );
        
        var heartbeats_sent = 0;
        var nervous_stdout_buffer = '';
        fake_nervous.stdout.on('data', function (data) {
            nervous_stdout_buffer += data;
            if ( nervous_stdout_buffer.indexOf('\n') !== -1  ) {
                if ( nervous_stdout_buffer.match( /heartbeat sent/ ) ) {
                    heartbeats_sent++;    
                    //console.log( "heartbeat sent" );
                }                
                nervous_stdout_buffer = '';
            }
        });
    
        process.on( 'uncaughtException', function(err) {  console.log(err); fake_nervous.removeAllListeners( 'exit' ); fake_nervous.kill() } ); 
    
        
        //let the test run for a bit
        setTimeout( function() { 
            
                fake_nervous.removeAllListeners( 'exit' );
                fake_nervous.kill();
                        
            //get the listener & proxy time to process any backlog before ending the test
            setTimeout( function() {
                
                t.ok( heartbeats_sent > 0, "heartbeats sent" );
                t.ok(  heartbeats_received > 0, "heartbeats received" );
                t.ok( plugin_fires > 0, "plugins fired" );
                t.ok( heartbeats_sent === heartbeats_received, "heartbeat sent equals heartbeats received" );
                t.ok( heartbeats_received === plugin_fires, "heartbeat received equals number of plugin fires" );
                
                
                response.removeAllListeners( 'exit' );
                response.kill();
                fake_graphite.removeAllListeners( 'exit' );
                fake_graphite.kill();                
                t.end();
                
            }, 1000 );
            
        }, 1000 );
    
    }, 1000 );
} );

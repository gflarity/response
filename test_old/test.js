#!/usr/bin/env node
var path = require('path');
var test = require("tap").test;
var fake_nervous = require('./lib/fake_nervous');

var test_succeeded = false;

test("graphite proxy", function (t) {

    var response = require('../lib/response.js');
    var GraphiteEventEmitter = require('../lib/graphite').GraphiteEventEmitter;
    
    var plugin_path = path.dirname( require.resolve('./test1' ) );
    
    //load the config
    var config = { 
        graphite_proxy : { 
            "listen_host" : "localhost",
            "listen_port" : 2003,
            "graphite_host" : "localhost",
            "graphite_port" : 2004, 
        },
        "plugin_path" : plugin_path
    };
    
    
    //simple test 3 heartbeats will trigger
    //initialize the fake pluggin and setup test cases
    
    //create the fake graphite
    var graphite_emitter = new GraphiteEventEmitter( config.graphite_proxy.graphite_host, config.graphite_proxy.graphite_port ); 
    
    var test_suceeded = false;
    var count = 0;
    var on_any = function( value, timestamp ) {
        //check output is correct?
    
        count++;
        if ( count === 3 ) {

            //received 3, sub test suceeded   
            test_succeeded = true;
        };
    };
    graphite_emitter.onAny( on_any );


    //need to give both response and the fake graphite (above) time to startup
    var my_fake_nervous;
    var my_response; 
    setTimeout( function() {
        //create the fake response, loads the test1 plugin
        my_response = new response.Response( config );

        //create the fake nervous, send to the fake response, check for result
        //and graphite getting metric    
        setTimeout( function() { 
            my_fake_nervous = new fake_nervous.FakeNervous( config.graphite_proxy.listen_host, config.graphite_proxy.listen_port, 1000 );
        }, 1000 );
        
    }, 1000);
    
    on_timeout = function() {
        
        console.log ( test_succeeded );
        
        t.ok( test_succeeded, "graphite proxy working" );
        my_response.destroy();
        my_fake_nervous.destroy();
        t.end();
    };
    setTimeout( on_timeout, 10000 );

});

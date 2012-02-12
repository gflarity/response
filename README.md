# Response - Monitoring doesn't have to suck.

Response is an simple Graphite proxy with plugable alerting support. It's first priority is to deliver messages to Graphite rapidly. In the event that Graphite goes down, messages will be buffered until Graphite is back.  Eventually Redis will be optionally supported to provide arbitrary levels of durability/persistence 

The second priority of Response is to provide a plugable alerting/response system. 

## Quick Start

./bin/response

## Developing Plugins

Check out the example_plugins directory.

Plugins are expected to play nice by not blocking the event loop and being mindful to store state safely. They receive two objects which both of which inherit from EventEmitter2. 

The first is the GraphiteEventEmitter. It can be used to subscribe to arbitrary events using wildcards. Plugins may use this to keep track of events they care about. 

The second is the Dispatcher. It too can be used to subscribe to arbitrary events, but the source of these events is exclusively other plugins. Plugins may use this publish or subscribe to alerts.

Plugins generally fall under too categories by convention. Those that identify certain conditions by subscribing to Graphite events, and those that respond to the conditions identified by the former.





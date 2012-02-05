# Response - Monitoring doesn't have to suck.

Response is an simple Graphite proxy with plugable alerting support. It's first priority is to deliver messages to Graphite rapidly. In the event that Graphite goes down, messages can optionally be buffered using Redis to provide arbitrary levels of durability/persistence until Graphite is back.

The second priority of Response is to provide a plugable alerting/response system. Graphite metric paths/names become events which 'Observer' plugins may subscribe to using the EventEmitter2 module/interface. They may raise different levels of alerts analogous to log levels. DEBUG, INFO, WARN, ERROR, FATAL. 'Reponder' plugins can be configured to subscribe to these different alert levels and respond as desired. 'Responder' plugins will be provided for email, sms, and jabber.

Plugins are expected to play nice by not blocking the event loop and being mindful to store state safely. 


## Quick Start

Coming soon.


## Developing Observers

Coming soon.

## Developing Responders

Coming soon.




# StatsD backend for Logstash compatible JSON output

## Overview

This is a pluggable backend for [StatsD][statsd] to flush stats into a Logstash compatible JSON file.

## Requirements

* [StatsD][statsd] versions >= 0.4.0.

## Installation

    $ cd /path/to/statsd
    $ npm install statsd-json-log-backend

## Configuration and Enabling

Add `json_log` configuration block and `statsd-json-log-backend` to the backends list in StatsD configuration file.

```js
{
  json_log: {
    application: 'application_name', // prefix to all the metric names in output [string, default: OS hostname]
    logfile: 'path-to-output-file'   // file to write the output to [string, default './statsd-log.json' ]
  },
  backends: [ 'statsd-json-log-backend' ]
}
```
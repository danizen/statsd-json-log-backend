/*jshint node:true, laxcomma:true */

/*
 * Flush stats to file in Logstash compatible JSON.

 * Only counters, gauges and measurements are supported.
 * As an exaple
 *   a counter 'application.counter_name',
 *   a gauge 'application.gauge_name'
 *   and measurement 'application.timer_name'
 * will be flushed into file as a single row looking something like this.
 *
 * {
 *   "@timestamp":"2014-07-04T11:00:56.355Z",
 *   "type":"application",
 *   "statsd.bad_lines_seen.count":0,
 *   "statsd.packets_received.count":7,
 *   "application.counter_name.count":3,
 *   "application.gauge_name.gauge":20,
 *   "application.timer_name.count_95":1,
 *   "application.timer_name.mean_95":4.452,
 *   "application.timer_name.upper_95":4.452,
 *   "application.timer_name.sum_95":4.452,
 *   "application.timer_name.sum_squares_95":19.820304,
 *   "application.timer_name.std":0,
 *   "application.timer_name.upper":4.452,
 *   "application.timer_name.lower":4.452,
 *   "application.timer_name.count":2,
 *   "application.timer_name.count_ps":2,
 *   "application.timer_name.sum":4.452,
 *   "application.timer_name.sum_squares":19.820304,
 *   "application.timer_name.mean":4.452,
 *   "application.timer_name.median":4.452
 * }
 *
 * To enable this backend, include 'statsd-json-log-backend' in the backends
 * configuration array:
 *
 *   backends: ['statsd-json-log-backend']
 *
 * This backend supports the following config options:
 *
 *   logfile:        file to write the output to [string, default './statsd-log.json' ]
 *   application:    application that emits the events [string, default: OS hostname]
 *
 */

var util = require('util');
var os = require('os');
var fs = require('fs');

function JsonLogBackend(startupTime, config, emitter, logger){
  var self = this;
  this.lastFlush = startupTime;
  this.lastException = startupTime;
  this.config = config.json_log || {};
  this.logger = logger;
  this.targetFile = this.config.logfile || './statsd-log.json';

  // attach
  emitter.on('flush', function(timestamp, metrics) { self.flush(timestamp, metrics); });
  emitter.on('status', function(callback) { self.status(callback); });
}

JsonLogBackend.prototype.flush = function(timestamp, metrics) {

  if (parseInt(metrics.counters['statsd.packets_received']) === 0) {
    return true;
  }

  var ts = new Date().toISOString();
  var application = this.config.application || os.hostname();

  var output = {
    '@timestamp': ts,
    type: application,
  }

  // counters
  var counters = metrics.counters;
  for (var key in counters) {
    output[key + '.count'] = counters[key]
  }

  // gauges
  var gauges = metrics.gauges;
  for (var key in gauges) {
    output[key + '.gauge'] = gauges[key]
  }

  // timers
  var timers = metrics.timer_data;
  for (var key in timers) {
    var data = timers[key];
    for (var item in data) {
      output[key + '.time.' + item] = data[item];
    }
  }

  var result = JSON.stringify(output) + '\n';

  fs.appendFile(this.targetFile, result, function(err) {
    if(err) return false;
  });

  return true;
};

JsonLogBackend.prototype.status = function(write) {
  ['lastFlush', 'lastException'].forEach(function(key) {
    write(null, 'statsd-json-log-backend', key, this[key]);
  }, this);
};

exports.init = function(startupTime, config, events) {
  var instance = new JsonLogBackend(startupTime, config, events);
  return true;
};
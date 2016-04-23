'use strict'

//TODO:
// extractions / transformations at destination level
// error if unknow config key was found
// figure out how to run with offline
// use standard error message format (stringify with indent)

var request = require('request')
var _ = require('underscore')
var qs = require('qs')
var jsonTransmogrifier = require('./json-transmogrifier.js')

var configs = require('./webhook-transmogrifier.json')

var CONFIG_DEFAULTS = {
  destinations: [],
  filters: [],
  transformations: [],
  extractions: [],
}
var DESTINATION_CONFIG_DEFAULTS = {
  method: 'POST',
  contentType: 'application/json',
  filters: [],
  transformations: [],
  extractions: [],
}

module.exports.buildWebhookRequest = function buildWebhookRequest(e, config) {
  var request = {
    contentType: e.contentType,
    method: e.method,
  }

  try {
    if(e.contentType === 'application/x-www-form-urlencoded') {
      request.json = qs.parse(e.body)
      if(config["json-embeded-form-parameter"])
        request.json = JSON.parse(decodeURIComponent(request.json[config["json-embeded-form-parameter"]]))
    } else
      request.json = e.json
  } catch(err) {
    throw new Error(`error parsing ${e.contentType} request for ${e.configName}: ${JSON.stringify(request.json, null, 2)} using config ${JSON.stringify(config, null, 2)} error message ${err}`)
  }

  return request
}

module.exports.configFor = function configFor(configName, configs) {
  var config = configs[configName]

  if(!config)
    throw new Error(`configuration for ${configName} not found`)
  _.defaults(config, CONFIG_DEFAULTS)

  if(config.destinations.length === 0)
    throw new Error(`destinations is required for the ${configName} configuration`)

  config.destinations.forEach((d) => {
    _.defaults(d, DESTINATION_CONFIG_DEFAULTS)
    if(!d.url)
      throw new Error(`url is required for all destinations, missing for ${configName} ${d}`)
  })

  return config
};

module.exports.transmogrifyAndDeliver = function transmogrifyAndDeliver(event, cb, override_configs) {
  var config = exports.configFor(event.configName, override_configs || configs)
  var webhookRequest = exports.buildWebhookRequest(event, config)

  var json = jsonTransmogrifier.transmogrify(config, webhookRequest.json, webhookRequest.json)

  exports.deliver(config, json, webhookRequest, function(results) {
    exports.logResults(results)
    cb(null, results)
  })
}

module.exports.deliver = function deliver(config, json, req, cb) {
  var original_json = req.json
  var results = {filtered: [], sent: [], errs: []}
  config.destinations.forEach((d) => {
    var transmogrifiedJson = jsonTransmogrifier.transmogrify(d, original_json, json)
    if(transmogrifiedJson === null) {
      results.filtered.push(d)
      if(_.values(results).reduce((sum, i) => { return sum + i.length }, 0) === config.destinations.length) {
        cb(results)
      }
      return
    }

    var options = {
      url: d.url,
      method: d.method,
    }
    options[d.contentType === 'application/x-www-form-urlencoded' ? 'form' : 'json'] = transmogrifiedJson
    request(options, function requestCallback(err, response, body) {
      if (err) {
        results.errs.push(`request for delivery ${d} failed`, err)
      } else {
        console.log(`successfully sent ${JSON.stringify(transmogrifiedJson)} to ${d.url} response: ${JSON.stringify(response)} body: ${body}`)
        d.json = transmogrifiedJson
        results.sent.push(d)
      }

      if(_.values(results).reduce((sum, i) => { return sum + i.length }, 0) === config.destinations.length) {
        cb(results)
      }
    })
  })
}

module.exports.logResults = function logResults(results) {
  console.log(results)
}

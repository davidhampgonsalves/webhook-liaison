'use strict'

//TODO:
// error if unknown config key was found
// run each operation against empty input to verify its valid jmespath
//
// figure out how to run with offline
// use standard error message format (stringify with indent)
//
var request = require('request')
var _ = require('underscore')
var qs = require('qs')
var jsonTransmogrifier = require('./json-transmogrifier.js')
require('json5/lib/require')

var WebhookResults = require('./webhook-results.js')
var configs = require('./webhook-transmogrifier.json5')

var CONFIG_DEFAULTS = {
  destinations: [],
}
var DESTINATION_CONFIG_DEFAULTS = {
  method: 'POST',
  contentType: 'application/json',
}

module.exports.buildWebhookRequest = function buildWebhookRequest(e, config) {
  var request = {
    contentType: e.contentType,
    method: e.method,
  }

  try {
    if(e.contentType === 'application/x-www-form-urlencoded') {
      request.json = qs.parse(e.body)
      if(config["jsonEmbededFormParameter"])
        request.json = JSON.parse(decodeURIComponent(request.json[config["jsonEmbededFormParameter"]]))
    } else
      request.json = e.json
  } catch(err) {
    throw new Error(`error parsing ${e.contentType} request for ${e.configName}: ${JSON.stringify(request.json, null, 2)} using config ${JSON.stringify(config, null, 2)} error message ${err}`)
  }

  return request
}

module.exports.configFor = function configFor(configName, configs) {
  var config = configs[configName]

  // backfill default config options
  if(!config)
    throw new Error(`configuration for ${configName} not found`)
  _.defaults(config, CONFIG_DEFAULTS)
  _.defaults(config, jsonTransmogrifier.CONFIG_DEFAULTS)

  if(config.destinations.length === 0)
    throw new Error(`destinations is required for the ${configName} configuration`)

  config.destinations.forEach((d) => {
    _.defaults(d, DESTINATION_CONFIG_DEFAULTS)
    _.defaults(d, jsonTransmogrifier.CONFIG_DEFAULTS)
    if(!d.url)
      throw new Error(`url is required for all destinations, missing for ${configName} ${d}`)
  })

  var errs = jsonTransmogrifier.validateConfig(config)
  //TODO log errors

  return config
}

module.exports.process = function process(event, cb, override_configs) {
  var config = exports.configFor(event.configName, override_configs || configs)
  var webhookRequest = exports.buildWebhookRequest(event, config)
  var results = new WebhookResults()

  var filter = jsonTransmogrifier.filter(config, webhookRequest.json)
  if(filter) {
    results.addFiltered(filter, webhookRequest.json)
    return cb(results)
  }
  var json = jsonTransmogrifier.transmogrify(config, webhookRequest.json)

  config.destinations.forEach((d) => {
    filter = jsonTransmogrifier.filter(d, webhookRequest.json)
    if(filter) {
      results.addFiltered(filter, webhookRequest.json)
      return results.isDeliveryComplete(config) && cb(results)
    }
    var jsonForDestination = jsonTransmogrifier.transmogrify(d, json)

    exports.deliver(d, jsonForDestination, webhookRequest, (deliveryResults) => {
      results.merge(deliveryResults)
      return results.isDeliveryComplete(config) && cb(results)
    })
  })
}

module.exports.deliver = function deliver(destination, json, req, cb) {
  var results = new WebhookResults()
  var options = {
    url: destination.url,
    method: destination.method,
  }

  options[destination.contentType === 'application/x-www-form-urlencoded' ? 'form' : 'json'] = json
  request(options, (err, response, body) => {
    if (err) {
      results.addDeliveryError(err, destination, json)
    } else {
      results.addDeliveryDetails(destination, json)
    }
    return cb(results)
  })
}

module.exports.logResults = function logResults(results) {
  // console.log(`successfully sent ${JSON.stringify(transmogrifiedJson)} to ${d.url} response: ${JSON.stringify(response)} body: ${body}`)
  console.log(results)
}


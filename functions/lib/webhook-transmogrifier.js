'use strict'

//TODO:
// error if unknown config key was found
// run each operation against empty input to verify its valid jmespath
//
// figure out how to run with offline
// use standard error message format (stringify with indent)
//
const request = require('request')
const _ = require('underscore')
const qs = require('qs')
const jmespath = require('jmespath')
const validUrl = require('valid-url')
require('json5/lib/require')

const jsonTransmogrifier = require('./json-transmogrifier.js')
const WebhookResults = require('./webhook-results.js')
const log = require('./logger.js')

const configs = require('./webhook-transmogrifier.json5')

var CONFIG_DEFAULTS = {
  destinations: [],
}
var DESTINATION_CONFIG_DEFAULTS = {
  method: 'POST',
  contentType: 'application/json',
}

module.exports.buildWebhookRequest = function buildWebhookRequest(e, config) {
  var request = {
    name: e.configName,
    contentType: e.contentType,
    method: e.method,
  }

  try {
    if(e.contentType === 'application/x-www-form-urlencoded') {
      request.json = qs.parse(e.body)
      if(config['jsonEmbededFormParameter'])
        request.json = JSON.parse(decodeURIComponent(request.json[config['jsonEmbededFormParameter']]))
    } else
      request.json = e.json
  } catch(err) {
    throw new Error(`error parsing ${e.contentType} request for ${e.configName}: ${JSON.stringify(request.json, null, 2)} using config ${JSON.stringify(config, null, 2)} error message ${err}`)
  }

  return request
}

var validOptions = ['url', 'auth','jsonEmbededFormParameter'].concat(
    Object.keys(DESTINATION_CONFIG_DEFAULTS),
    Object.keys(CONFIG_DEFAULTS),
    Object.keys(jsonTransmogrifier.CONFIG_DEFAULTS))

module.exports.validateConfig = function validateConfig(config) {
  var errs = []

  if(config.destinations.length === 0)
    errs.push(`at least one destination is required.`)
  else {
    var invalidUrls = _.reduce(config.destinations, (invalids, d) => {
      if(!validUrl.isUri(d.url))
        invalids.push(d.url)
      return invalids
    }, [])
    if(invalidUrls.length > 0)
      errs.push(`invalid url(s) ${JSON.stringify(invalidUrls)}.`)
  }

  errs = errs.concat(jsonTransmogrifier.validateConfig(config),
      _.flatten(config.destinations.map(jsonTransmogrifier.validateConfig)))

  var options = Object.keys(config).concat(config.destinations.reduce((o, d) => o.concat(Object.keys(d)), []))
  var invalidOptions = _.difference(_.flatten(options), validOptions)
  if(invalidOptions.length > 0)
      errs.push(`invalid configuration option(s) ${JSON.stringify(invalidOptions)}.`)

  return errs
}

module.exports.configFor = function configFor(configName, configs) {
  var config = configs[configName]

  if(!config)
    return null

  _.defaults(config, CONFIG_DEFAULTS)
  _.defaults(config, jsonTransmogrifier.CONFIG_DEFAULTS)

  config.destinations.forEach((d) => {
    _.defaults(d, DESTINATION_CONFIG_DEFAULTS)
    _.defaults(d, jsonTransmogrifier.CONFIG_DEFAULTS)
  })

  return config
}

module.exports.process = function process(event, cb, override_configs) {
  var config = exports.configFor(event.configName, override_configs || configs)
  if(!config) {
    log.log(`Config for ${event.configName} not found`, event)
    throw new Error(`config ${event.configName} not found`)
  }
  var errs = exports.validateConfig(config)
  if(errs.length > 0)
    log.errors(event.configName, errs)

  var webhookRequest = exports.buildWebhookRequest(event, config)
  var results = new WebhookResults(event.configName)

  var filter = jsonTransmogrifier.filter(config, webhookRequest.json)
  if(filter) {
    results.addFiltered(null, webhookRequest.json, filter)
    return cb(results)
  }
  var json = jsonTransmogrifier.transmogrify(config, webhookRequest.json)

  config.destinations.forEach((d) => {
    filter = jsonTransmogrifier.filter(d, webhookRequest.json)
    if(filter) {
      results.addFiltered(d, webhookRequest.json, filter)
      return results.isDeliveryComplete(config) ? cb(results) : null
    }
    var jsonForDestination = jsonTransmogrifier.transmogrify(d, json)

    exports.deliver(d, jsonForDestination, webhookRequest, (deliveryResults) => {
      results.merge(deliveryResults)
      return results.isDeliveryComplete(config) ? cb(results) : null
    })
  })
}

module.exports.deliver = function deliver(destination, json, req, cb) {
  var results = new WebhookResults(req.configName)
  var options = {
    url: destination.url,
    method: destination.method,
  }

  if(destination.auth)
    options.auth = destination.auth

  options[destination.contentType === 'application/json' ? 'json' : 'form'] = json
  request(options, (err, response, body) => {
    if (!err && response.statusCode >= 200 && response.statusCode < 300) {
      results.addDeliveryDetails(destination, json)
    } else {

      results.addDeliveryError(destination, json, err ? err : `${response.statusCode}: ${body}`)
    }
    return cb(results)
  })
}

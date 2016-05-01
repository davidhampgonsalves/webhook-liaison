'use strict'

//TODO:
// figure out how to run with offline
// result.log should be single console.log
// tranformation errors should show in results log
//
// shorten url function path?
//
const request = require('request')
const _ = require('underscore')
const jmespath = require('jmespath')
const validUrl = require('valid-url')
require('json5/lib/require')

const jsonTransmogrifier = require('./json-transmogrifier.js')
const WebhookResults = require('./webhook-results.js')
const WebhookRequest = require('./webhook-request.js')
const log = require('./logger.js')

const configs = require('./webhook-transmogrifier.json5')

var CONFIG_DEFAULTS = {
  destinations: [],
}
var DESTINATION_CONFIG_DEFAULTS = {
  method: 'POST',
  contentType: 'application/json',
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
  var configs = override_configs || configs
  var configName = event.configName
  var config = exports.configFor(configName, configs)

  if(!config) {
    log.errors([`Config for ${configName} not found in current options; `, _.keys(configs), ' for ', event])
    return
  }

  var errs = exports.validateConfig(config)
  if(errs.length > 0) {
    log.errorsFor(configName, errs)
    return
  }

  var webhookRequest = new WebhookRequest(event, config)
  var results = new WebhookResults(configName)

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

    exports.deliver(d, jsonForDestination, configName, (deliveryResults) => {
      results.merge(deliveryResults)
      return results.isDeliveryComplete(config) ? cb(results) : null
    })
  })
}

module.exports.deliver = function deliver(destination, json, configName, cb) {
  var results = new WebhookResults(configName)
  var options = {
    url: destination.url,
    method: destination.method,
  }

  if(destination.auth)
    options.auth = destination.auth

  var formatOption = 'form'
  if(destination.method === 'GET')
    formatOption = 'qs'
  else if(destination.contentType === 'application/json')
    formatOption = 'json'

  options[formatOption] = json
  request(options, (err, res, body) => {
    if(err || res.statusCode < 200 || res.statusCode >= 300) {
      const details = err ? { response: err.message } : { statusCode: res.statusCode, response: body }
      results.addDeliveryError(destination, json, details)
    } else
      results.addDeliveryDetails(destination, json, options)

    return cb(results)
  })
  return options
}

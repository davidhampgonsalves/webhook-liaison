'use strict'

const request = require('request')
const _ = require('underscore')
const jmespath = require('jmespath')
const validUrl = require('valid-url')

const jsonTransmogrifier = require('./json-transmogrifier.js')
const WebhookResults = require('./webhook-results.js')
const WebhookRequest = require('./webhook-request.js')
const webhookConfig = require('./webhook-config.js')
const log = require('./logger.js')

module.exports.process = function process(event, cb, override_configs) {
  var configs = override_configs || require('./webhook-transmogrifier.json5')

  var configName = event.configName
  var results = new WebhookResults(configName)
  var config = webhookConfig.configFor(configName, configs)

  if(!config)
    results.addErrors([`Config for ${configName} not found. Availiable configs: ${_.keys(configs)}.`])
  else
    results.addErrors(webhookConfig.validateConfig(config))

  if(results.isDeliveryComplete(config))
    return cb(results)

  var webhookRequest = new WebhookRequest(event, config)
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

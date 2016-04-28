'use strict'

const _ = require('underscore')

const logger = require('./logger.js')

const RESULT_TYPES = ['filtered', 'sent', 'errors']

function WebhookResults(configName) {
  this.filtered = []
  this.sent = []
  this.errors = []
  this.configName = configName
  this.all = RESULT_TYPES.map((t) => this[t])
}

WebhookResults.prototype.merge = function merge(results) {
  this.all.forEach((resultForType, i) => {
    Array.prototype.push.apply(resultForType, results.all[i])
  })
}

WebhookResults.prototype.isDeliveryComplete = function isDeliveryComplete(config) {
  return this.all.reduce((sum, i) => { return sum + i.length }, 0) === config.destinations.length
}

WebhookResults.prototype.addFiltered = function addFiltered(destination, json, filter) {
  this.addResult('filtered', destination, json, { filter: filter })
}

WebhookResults.prototype.addDeliveryError = function addDeliveryError(destination, json, error) {
  this.addResult('errors', destination, json, { error: error })
}

WebhookResults.prototype.addDeliveryDetails = function addDeliveryDetails(destination, json) {
  this.addResult('sent', destination, json)
}

WebhookResults.prototype.addResult = function addResult(type, destination, json, result) {
  this[type].push(_.extend({ destination: destination, json: json }, result))
}

WebhookResults.prototype.log = function log() {
  logger.log(this.configName + ' request results\n')
  RESULT_TYPES.forEach((type) => {
    if(this[type].length <= 0)
      return

    logger.log('= ' + type + ' ====\n')
    this[type].forEach((result) => logResult(type, result))
    logger.log('\n')
  })
}

function logResult(type, result) {
  var msg = null
  var d = result.destination

  if(type === 'filtered') {
    msg = [ `  ${result.filter} prevented request to ${d ? d.url : ' all '} based on ` ]
  } else {
    msg = [ `  ${d.method} ${d.url} ${d.contentType}` ]
    if(type !== 'sent')
      msg = msg.concat([' failed b/c ', result.error ])
    msg.push(' with data')
  }
  msg.push(result.json)

  logger.log.apply(null, msg)
}

module.exports = WebhookResults

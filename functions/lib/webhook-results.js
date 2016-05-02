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
  this.addResult('errors', destination, json, error)
}

WebhookResults.prototype.addDeliveryDetails = function addDeliveryDetails(destination, json, options) {
  this.addResult('sent', destination, json, { requestOptions: options})
}

WebhookResults.prototype.addResult = function addResult(type, destination, json, result) {
  this[type].push(_.extend({ destination: destination, json: json }, result))
}

WebhookResults.prototype.log = function log() {
  var msgs = [`${this.configName}  request results`]
  msgs = RESULT_TYPES.reduce((msgs, type) => msgs.concat(this.msgForType(type)), msgs)
  return logger.logAll(msgs)
}

WebhookResults.prototype.msgForType = function msgForType(type) {
  if(this[type].length <= 0)
    return []

  var msg = ['', `= ${type}  ====`]
  this[type].forEach((result) => {
    var d = result.destination
    var line = ['  ']
    if(type === 'filtered') {
      line.push(`${result.filter} prevented request to ${d ? d.url : ' all '} based on `)
    } else {
      line.push(`${d.method} ${d.url} ${d.contentType}`)
      if(type === 'errors')
        line.push(' failed b/c ', logger.frmt(result.error))
      line.push(' with data ')
    }
    msg.push(line.join(''))
  })

  return msg
}

module.exports = WebhookResults

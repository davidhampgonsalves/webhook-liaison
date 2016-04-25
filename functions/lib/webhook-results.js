'use strict'

var _ = require('underscore')

function WebhookResults() {
  this.filtered = []
  this.sent = []
  this.errs = []
  this.all = _.values(this)
}

WebhookResults.prototype.merge = function merge(results) {
  this.all.forEach((resultForType, i) => {
    Array.prototype.push.apply(resultForType, results.all[i])
  })
}

WebhookResults.prototype.isDeliveryComplete = function isDeliveryComplete(config) {
  return this.all.reduce((sum, i) => { return sum + i.length }, 0) === config.destinations.length
}

WebhookResults.prototype.addFiltered = function addFiltered(filter, json) {
  this.filtered.push({ filter: filter, json: json })
}

WebhookResults.prototype.addDeliveryError = function addDeliveryError(err, destination, json) {
  this.errs.push({ err: err, destination: destination, json: json })
}

WebhookResults.prototype.addDeliveryDetails = function addDeliveryDetails(destination, json) {
  this.sent.push({ destination: destination, json: json })
}

module.exports = WebhookResults

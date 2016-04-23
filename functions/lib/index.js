'use strict'

var webhookTransmogrifier = require('./webhook-transmogrifier.js')
var jsonTransmogrifier = require('./json-transmogrifier.js')

module.exports = {
  webhookTransmogrifier: webhookTransmogrifier,
  jsonTransmogrifier: jsonTransmogrifier,
}

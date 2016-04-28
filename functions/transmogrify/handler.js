'use strict'

const lib = require('../lib/webhook-transmogrifier.js')
const log = require('../lib/logger.js')

module.exports.handler = function(event, context) {
  log.log('event:', event)

  lib.process(event, function callback(results) {
    results.log()
    if(results.errors.length > 0)
      context.fail()
    else
      context.done(null, results)
  })
}

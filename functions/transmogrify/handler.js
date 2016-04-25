'use strict'

var lib = require('../lib/webhook-transmogrifier.js')

module.exports.handler = function(event, context) {
  console.log('event:', event)

  lib.transmogrifyAndDeliver(event, function callback(results) {
    //TODO: something
    context.done(null, {
      message: 'transmogrify!'
    })
  })
}

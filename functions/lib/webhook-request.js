'use strict'

const qs = require('qs')
const _ = require('underscore')

const log = require('./logger.js')

function WebhookRequest(e, config) {
  this.name =  e.configName
  this.contentType = e.contentType
  this.method = e.method

  var json = e.json
  try {
    if(e.contentType === 'application/x-www-form-urlencoded') {
      json = qs.parse(e.body)
      if(config['jsonEmbededFormParameter'])
        json = JSON.parse(decodeURIComponent(json[config['jsonEmbededFormParameter']]))
    }
  } catch(err) {
    throw new Error(`error parsing ${e.contentType} request for ${e.configName}: ${log.frmt(json)} using config ${log.frmt(config)} error message ${err}`)
  }

  if(!_.isObject(json))
    throw new Error(`After applying configuration request was not JSON ${log.frmt(json)} for ${log.frmt(e)}`)

  this.json = json
}

module.exports = WebhookRequest

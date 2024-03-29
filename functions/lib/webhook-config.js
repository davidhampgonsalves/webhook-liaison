'use strict'

const _ = require('underscore')
const jmespath = require('jmespath')
const validUrl = require('valid-url')
const colors = require('colors/safe')
require('json5/lib/require')

const jsonTransmogrifier = require('./json-transmogrifier.js')
const log = require('./logger.js')

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

module.exports.validateConfigs = function validateConfigs() {
  const configs = require('./webhook-transmogrifier.json5')
  _.chain(configs).keys().each((name) =>  {
    var config = exports.configFor(name, configs)
    var errs = exports.validateConfig(config)

    if(!_.isEmpty(errs)) {
      console.warn(colors.red(`${name} \u2717`))
      _.each(errs, (err) => console.warn(colors.yellow(` ${err}`)))
    } else
      console.log(colors.green(`${name} \u2713`))
  })
  console.log()
}

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
      errs.push(`invalid url(s) ${log.frmt(invalidUrls)}.`)
  }

  errs = errs.concat(jsonTransmogrifier.validateConfig(config),
      _.flatten(config.destinations.map(jsonTransmogrifier.validateConfig)))

  var options = Object.keys(config).concat(config.destinations.reduce((o, d) => o.concat(Object.keys(d)), []))
  var invalidOptions = _.difference(_.flatten(options), validOptions)

  if(invalidOptions.length > 0)
    errs.push(`invalid configuration option(s) ${log.frmt(invalidOptions)}.`)

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

'use strict'

var fs = require('fs')
var _ = require('underscore')
var jmespath = require('jmespath')

module.exports.CONFIG_DEFAULTS = {
  filters: [],
  transformations: [],
  extractions: [],
}

module.exports.validateConfig = function validateConfig(config) {
  var errs = []

  var operationTypes = ['filters', 'extractions', 'transformations']
  operationTypes.forEach((operationType) => {
    var operations = jmespath.search(config, `[[${operationType}], b[].${operationType}][]`)

    operations.forEach((operation) => {
      if(!_.isArray(operation)) {
        errs.push(`${operationType} "${operation}" should be an array ${config}.`)
        return
      }
      try {
        jmespath.compile(operation)
      } catch(err) {
        errs.push(`${operationType} "${operation}" was not a valid JMESPath.`)
      }
    })
  })

  return errs
}

module.exports.filter = function filter(config, input) {
  var filters = config["filters"]

  for(var i=0, len=filters.length ; i < len ; i++) {
    var f = filters[i]
    try {
      if(!jmespath.search(input, f)) {
        return f
      }
    } catch(err) {
      throw new Error(`${err} occured for filter:
        ${JSON.stringify(f , null, 2)}
        for input:
        ${JSON.stringify(input, null, 2)}`)
    }
  }

  return null
}

module.exports.transmogrify = function transmogrify(config, json) {
  json = transform(config, json)
  return extract(config, json)
}

function transform(config, input) {
  var output = JSON.parse(JSON.stringify(input))
  return transmogrify(config, "transformations", input, output)
}

function extract(config, input) {
  return transmogrify(config, "extractions", input, {})
}

function transmogrify(config, action, input, output) {
  if(config[action].length === 0)
    return input

  config[action].forEach((expression) => {
    try {
      _.extend(output, jmespath.search(input, expression))
    } catch(err) {
      throw new Error(`${err} occured for ${action}:
        ${JSON.stringify(expression , null, 2)}
        for input:
        ${JSON.stringify(input, null, 2)}`)
    }
  })

  return output
}

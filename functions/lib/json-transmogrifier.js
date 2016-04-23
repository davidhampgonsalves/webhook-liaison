'use strict'

var fs = require('fs')
var _ = require('underscore')
var jmespath = require('jmespath')

module.exports.transmogrify = function transmogrify(config, original_json, json) {
  if(filter(config, original_json))
    return null

  json = transform(config, json)
  return extract(config, json)
}

function filter(config, input) {
  var f = config["filters"]

  for(var i=0, len=f.length ; i < len ; i++) {
    try {
      if(!jmespath.search(input, f[i])) {
        console.log(`event filtered by ${f[i]}`)
        return true
      }
    } catch(err) {
      throw new Error(`${err} occured for filter:
        ${JSON.stringify(f[i] , null, 2)}
        for input:
        ${JSON.stringify(input, null, 2)}`)
    }
  }

  return false
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


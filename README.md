# Webhook Liaison &nbsp;&nbsp;[![Code Climate](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier/badges/gpa.svg)](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier) [![Test Coverage](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier/badges/coverage.svg)](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier/coverage) [![CircleCi](https://circleci.com/gh/davidhampgonsalves/webhook-liaison.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/davidhampgonsalves/webhook-liaison) [![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![MIT license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://en.wikipedia.org/wiki/MIT_License)
> A configurable filtering/transforming proxy for Webhooks / HTTP requests.

Webhook-liason converts request data to JSON, limits subsequent requests via filters and finally transforms the request JSON into the destination(s) format to be sent.

## Features
* Filters & transformations are powered by super powerful [JMESPath](https://jmespath.org) query language.
* Runs on [AWS Lambda](https://aws.amazon.com/lambda/) using [Serverless Framework](https://github.com/serverless/serverless) so its low maintenance and probably free(< 1 million requests a month).
* Single inbound Webhook can trigger multiple outbound Webhooks each with its own filters & transformations.
* Supports `application/x-www-form-urlencoded` & `application/json` content-types for inbound/outbound requests.
* Handles GET requests & query string parameters.
* HTTP authentication.

##Examples
* __[Github -> Slack](functions/lib/webhook-liaison.example.json5#L2)__: Post to [Slack](https://www.slack.com) when a pull request is labelled.
* __[Travis-CI -> IFTTT](functions/lib/webhook-liaison.example.json5#L33)__: Trigger [IFTTT](https://www.ifttt.com) when tests fail / fixed on master.
* __[Papertrail -> Twillio(SMS)](functions/lib/webhook-liaison.example.json5#L53)__: Send SMS via [Twillio](https://www.twilio.com) when errors are detected on [Papertrail](https://papertrailapp.com).

## Installation
### Run Locally
* `npm install && npm start`
* [Configure](#configuration-options)

_test: `curl -X POST -d '{"json": "data"}' http://localhost:3000/hook/<config-name>`_

## Deploy to AWS Lambda
* Install the [Serverless Framework](https://github.com/serverless/serverless/).
* Clone this repo.
* [Configure](#configuration-options)
* Deploy `sls dash deploy`.
* Test  / check cloud watch logs.

_test: `curl -X POST -d '{"json": "data"}' http://<aws-lambda-url>.com/webhookliaison/hook/<config-name>`_

## Operations
Operations are all powered by the JMESPath query language and can be defined at both destination and root level. Operations configured at the destination level will be applied to the output of the root level operations.

See [JMESPath tutorial](http://jmespath.org/tutorial.html) to learn the syntax / test your queries.

### Filters
Control when subsequent requests are sent. They are defined as a list of JMESPaths queries that will block the webhook from being triggered if they return a falsy value.
```
filters: [
  "successMessage",  // filter if missing successMessage
  "attribute  == `success`", // filter if attribute do not equal success.
  "length(errors[? severity == `critical`]) > `2`", // filter if less then 2 critical errors
]
```

### Transformations
Modify the JSON data(all request data types are converted to JSON) via a map of `key : JMESPaths`. Existing attributes will be preserved and new attributes will be merged in.
```
transformations: [
  {
    worldCities: "countries[].states[].cities[].name | sort(@)", // sorted list of cities.
    listOfAttributes: "[ countries[0].name, countries[1].name ]", // list of selected attributes
    msg: "join(' ', ['Hello', user.firstName, user.lastName])", // concat attributes and text into string
    details: "{ name: users[0].name, email: people[0].email }", // create object from attributes
    errors: "actions.*.errors", // create list of errors (if any) from nested data
  }
]
```

### Extractions
Modify the JSON data exactly the same way as [transformations](#transformations) except they start with a blank state (only attributes/selectors you define will be included in request).

## Configuration Options
Configuration file supports [JSON5](https://github.com/json5/json5) which allows a cleaner syntax + comments. Example configuration can be found in [here](functions/lib/webhook-liaison.example.json5).

* __jsonEmbededFormParameter__: Extract URIEncoded JSON data from `x-www-form-urlencoded` field.
* __filters__: See [filters](#filters) for details.
* __extractions__: See [extractions](#extractions) for details.
* __transitions__: See [transitions](#transitions) for details.
* __destinations__: destination(s) define subsiquent wehbooks to be sent.
  * __url__: url to make request against.
  * __contentType__: Content type for request data (Will be converted to JSON).
  * __auth__: HTTP authentication parameters.
    * __user__: HTTP authentication user name.
    * __pass__: HTTP authentication password.

## Non Webhook Enabled Services
All HTTP methods are supported + authentication. Form & JSON content types, GET method and query string parameters so if it supports HTTP requests you can probably interact with it.

## Common Issues
`Unable to import module '_serverless_handler'` : Happens if you `sls dash deploy` in directory other than app root.


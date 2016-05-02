# webhook-transmogrifier
[![Code Climate](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier/badges/gpa.svg)](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier)
[![CircleCi](https://circleci.com/gh/davidhampgonsalves/webhook-transmogrifier.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/davidhampgonsalves/webhook-transmogrifier)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![MIT license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://en.wikipedia.org/wiki/MIT_License)

##Features
* Runs on [AWS Lambda](https://aws.amazon.com/lambda/) using [Serverless Framework](https://github.com/serverless/serverless) so its low maintenence and probably free(< 1 million requests a month).
* All filters & transformations are powered by the super powerful and nearly ubiquitous [JMESPath](https://jmespath.org).
* Single Webhook can trigger multiple outbound Webhooks each with its own filters & transformations.
* Supports `application/x-www-form-urlencoded` & `application/json` content-types for inbound/outbound requests.
* Handles GET requests & query string paramters.
* HTTP authentication.

##Examples
###Github -> Slack
Post to Slack when a pull request is labelled.
```
"github-pr": {
  "destinations": [{ "url": "< SLACK WEBHOOK URL >" }],
  "filters": [
    "action == `labeled`",
    "ends_with(label.name, `label-name`)"
  ],
  "extractions": [ "{ text: join('', ['<', pull_request.html_url, '|', pull_request.title '> by ', pull_request.user.login]) }" ]
}
```
Then [configure](https://developer.github.com/webhooks/) GitHub to send a webhook to: `http://aws-lambda-url.com/webhooktransmogrifier/transmogrify/github-pr`.


###Travis-CI -> Slack
Post to Slack when CI breaks or is fixed on an important branch.
```
"travis-ci": {
  "json-embeded-form-parameter": "payload",
  "destinations": [{ "url": "< SLACK WEBHOOK URL >" }],
  "filters": [
    "branch == `master` || branch == `important_branch`",
    "status_message == `Fixed` || status_message == `Broken`"
  ],
  "extractions": [ "{ text: join('', ['Tests are *', status_message, '* on `', branch, '`: ', message]) }" ]
}
```
Then [configure](https://docs.travis-ci.com/user/notifications/#Webhook-notification) [Travis-CI](https://travis-ci.com/) to send a webhook to: `http://aws-lambda-url.com/webhooktransmogrifier/transmogrify/travis-ci`.

###Papertrail -> SMS (Twillio)

###IFTTT -> ________


##Installation
###Run Locally
`npm install && npm start`
__You can curl requests to test `curl -X POST -d '{"json": "data"}' http://localhost:3000/config-name`

##Deploy to AWS Lambda
* Install the [Serverless Framework](https://github.com/serverless/serverless/).
* Clone this repo.
* Modify one of the example configs, found in: [`functions/lib/webhook-transmogrifier.json5`](functions/lib/webhook-transmografier.json5).
* Deploy `sls dash deploy`.

##Configuration Options
Configuration file support [JSON5](https://github.com/json5/json5) which allows a cleaner syntax + comments.

```

```

##Non Webhook Enabled
All HTTP methods are supported + authentication. Form & JSON content types, GET method and query string parameters.

##Common Issues
`Unable to import module '_serverless_handler'` : Happens if you `sls dash deploy` in directory other than app root.


# webhook-transmogrifier
[![Code Climate](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier/badges/gpa.svg)](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier)
[![CircleCi](https://circleci.com/gh/davidhampgonsalves/webhook-transmogrifier.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/davidhampgonsalves/webhook-transmogrifier)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![MIT license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://en.wikipedia.org/wiki/MIT_License)

##Features
* Runs on [AWS Lambda](https://aws.amazon.com/lambda/) using [Serverless Framewor](https://github.com/serverless/serverless) so its low maintenence and probably free(< 1 million inbound webhooks a month).
* All filters & transformations are powered by the super powerful [JMESPath](https://jmespath.org).
* Single inbound Webhook can trigger multiple outbound  Webhooks each with its own filters & transformations.
* Supports `application/x-www-form-urlencoded` & `application/json` content-types for inbound/outbound requests.

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


##Installation
Install serverless
Clone this repo
Make some configurations
`sls dash deploy`

##Configuration Options
```
"extractions-transformations-on-destinations": {
  "destinations": [
    {
      "url": "http://jsonplaceholder.typicode.com/posts/1",
    },
    {
      "url": "http://jsonplaceholder.typicode.com/posts/2",
      "method": "PUT",
      "contentType": "application/x-www-form-urlencoded",
      "filters": ["locations[0].name == 'Not Found'"]
      "transformations": [
        "{ someCities: locations[1:3], cityCount: length(locations) }",
        "{ keys: keys(@) }"
      ],
      "extractions": [
        "{ message: join(' ', ['you live in', locations[0].name]) }",
        "{ someStates: someCities[].state }",
        "{ k: keys }"
      ]
    }
  ],
  "filters": [
    "branch == `master` || branch == `important-branch`",
    "status_message == `Fixed` || status_message == `Broken`"
  ],
  "transformations": [
    "{ someCities: locations[1:3], cityCount: length(locations) }",
    "{ keys: keys(@) }"
  ],
  "extractions": [
    "{ message: join(' ', ['you live in', locations[0].name]) }",
    "{ someStates: someCities[].state }",
    "{ k: keys }"
  ]
}
```

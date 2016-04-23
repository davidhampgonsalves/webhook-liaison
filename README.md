# webhook-transmogrifier
[![Code Climate](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier/badges/gpa.svg)](https://codeclimate.com/github/davidhampgonsalves/webhook-transmogrifier)
[![CircleCi](https://circleci.com/gh/davidhampgonsalves/webhook-transmogrifier.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/davidhampgonsalves/webhook-transmogrifier)
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![MIT license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://en.wikipedia.org/wiki/MIT_License)

##Features
* Runs on AWS Lambda which means it will probably be free to use(> 1 million inbound webhooks).
* Super powerful [JMESPath](https://jmespath.org) powers all filters & transformations.
* Single Webhook can trigger many Webhooks each with own filters & transformations.

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
Then [configure](https://developer.github.com/webhooks/) GitHub to push the webhook to your aws endpoint like: https://aws-lambda-url.com/webhooktransmogrifier/transmogrify/github-pr


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
    "extractions": [ "{ text: join(' ', ['Tests are *', status_message, '* on `', branch, '`: ', message]) }" ]
  }
```
Then [configure](https://docs.travis-ci.com/user/notifications/#Webhook-notification) [Travis-CI](https://travis-ci.com/) to push the webhook to your aws endpoint like: https://aws-lambda-url.com/webhooktransmogrifier/transmogrify/travis-ci


##Installation
Install serverless
Clone this repo
Make some configurations
`sls dash deploy`


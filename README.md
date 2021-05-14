# Platform Support Slack Bot

## Launching Platform Support Slack Bot

Install dependencies:

`$ yarn install`

To start the slack bot locally:

`$ yarn start`

Note: In order for Slack to communicate with the slack bot, you must either deploy it or use a tunneling tool like ngrok.

## Running Unit Tests

To run unit tests:

`$ yarn test`

### Randomizing Unit Tests

To run tests in random order, install `coreutils`.

`$ brew install coreutils`

Then run the unit tests in random order:

`$ yarn test:random`

## Environment Variables

To configure the Slackbot, the following environment variables are used:

- **SLACK_BOT_TOKEN** - The OAuth token at https://api.slack.com/ when the Platform Support app was initially configured.
- **SLACK_SIGNING_SECRET** - The signing secret for Slack to verify the authenticity of calls.
- **SLACK_WEB_SOCKET_APP_TOKEN** - Token used by the Slack bot when connecting to Slack using Socket Mode. This Slack bot is using Socket Mode to communicate with Slack and does not need to expose an external IP.
- **SLACK_SUPPORT_CHANNEL** - The id of the Platform Support channel used for the default location where the slack bot will post messages. See below regarding how to get the channel id.
- **TEAMS_SPREADSHEET_ID** - The id of the Google sheet where teams and associated information is stored. This is for the team drop down selection. See below regarding how to get a Google sheet id.
- **RESPONSES_SPREADSHEET_ID** - The id of the Google sheet where the responses are stored and written to. See below regarding how to get a Google sheet id.
- **LOG_LEVEL** - The level for application logs. See below for more details.
- **PAGER_DUTY_API_KEY** - The API key to access data in the PagerDuty application.
- **GOOGLE_CLIENT_ID** - Google Client Id used for accessing Google Sheets
- **GOOGLE_PRIVATE_KEY** - Certificate used for accessing Google Sheets
- **GOOGLE_PRIVATE_KEY_ID** - Certificate Id used for accessing Google Sheets

## Logging

To set the current log level, set the environment variable: `LOG_LEVEL`.

```
$ export LOG_LEVEL=debug  # Set log level to debug
$ export LOG_LEVEL=trace  # Set log level to trace
```

Log levels are defined [here](https://getpino.io/#/docs/api?id=levels)

| Level | Number |
| ----- | ------ |
| trace | 10     |
| debug | 20     |
| info  | 30     |
| warn  | 40     |
| error | 50     |
| fatal | 60     |

Note: By default the log level is `info` if not provided.

To pretty print logs, run the following command:

```
$ node src/app.js | pino-pretty
```

Running `npm start` does the same.

## Google Sheets

TODO:

- Setting up a Service Account with Google Developer Console
- Getting the Spreadsheet ID and setting it up as an environment variable
- Top row is the header row, ideally don't use spaces since they become JavaScript properties

**Granting Sheet Permissions To Slack Bot**

To give the service account permissions, create a new Google sheet in your account and give the following account `edit` permission access.

```
platform-support-bot@platform-support-bot-312013.iam.gserviceaccount.com
```

This is the service account created for the Platform Service Bot. Google Sheets will ask you if you want to give write permissions to this spreadsheet outside of the organization. Click Yes.

## Docker

A Docker image is built to containerize the application. Download and install Docker from [here](https://www.docker.com/get-started).

First build the Docker image and run it using the following commands:

**Building the Docker Image**

Build the Docker image by running the following command:

```
$ docker build -t plaform_support_slackbot:1.0 .
```

**Starting the Container**

Then run the docker image by using this command:

```
docker run --env-file=.env plaform_support_slackbot:1.0
```

If you want to run it in the background (local only):

```
docker run -d --read-only -v "$PWD:$PWD" -w "$PWD" plaform_support_slackbot:1.0
```

_Note:_ the above command will allow the container to get read only access to the local path so that it may access the `.env` file. Ideally, we would want to use `docker run -d --env-file=.env plaform_support_slackbot:1.0` but multiline environment variables do not seem to work properly.

<!--
Note: Using the `.env` file with docker run does not work since multiline environment variables doesn't seem to work passed this way.

```
docker run -d --env-file=.env plaform_support_slackbot:1.0
```

! Does Not Work! Future: look at using Docker Compose.
-->

**Other Helpful Commands**

Check for Docker background processes:

```
docker ps
```

Stop Docker container by passing in the Container Id from `docker ps`.

```
docker stop [CONTAINER ID]
```

## Deployment

### Heroku

Currently, the Slack bot is deployed on Heroku as a worker dyno on dsva-support-bot. Contact Michael Fleet to access. [Heroku Dashboard](https://dashboard.heroku.com/apps/dsva-support-bot)

Please note this is temporary.

1. Install the Heroku CLI. Click [here](https://devcenter.heroku.com/articles/heroku-cli).
2. Login to Heroku using this command: `heroku login`.
3. Make sure the changes are in GIT.
4. Push to Heroku to deploy: `git push heroku master`.

### AWS Elastic Kubernetes Service

This is the long term solution for the Slack bot deployment. The docker image has been created. All that needs to happen for deployment are the environment variables need to be set. See above for the list of environment variables.

## Additional Documentation

Additional high level documentation can be found [here](https://docs.google.com/document/d/1loKKQCD1gqlvIdxucsYAjDbd_tSCnqvxs-W-nVxzwGM/).

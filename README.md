# lunch-assistant
Hackfest 2023 Kuopio team lunch assistant.

Fetches lunch menu from Origo restaurant and asks descriptions and recommendations from OpenAI GPT. Then posts the recommendations to Slack channel.

## Code

Github: https://github.com/Vincit/lunch-assistant

## Prerequisites

Install Azure CLI and Azure Functions CLI:

- `brew install azure-cli` (or equivalent in other OS)
- `npm install -g azure-functions-core-tools@3 --unsafe-perm true`

Login to Azure:

`az login`

You have to have permissions to Vincit Azure OpenAI Playground.

## How to use?

- `npm start` - Run locally
- `npm run build` - Build TypeScript into JS
- `npm run test` - Test locally (remember to put secrets into .env)
- `npm run deploy` - Deploy function to Azure

## Scheduling

Workdays at 10am.

## Hosting

As Azure Function App called `lunch-premium`. We had to use Premium plan to make integration to OpenAI Playground working.

Manual trigger by HTTP GET: http://lunch-premium.azurewebsites.net/api/slack
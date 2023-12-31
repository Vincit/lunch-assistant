# lunch-assistant
Hackfest 2023 Kuopio team lunch assistant.

Fetches lunch menu from Origo restaurant and asks descriptions and recommendations from OpenAI GPT. Then posts the recommendations to Slack channel.

## Code and CI/CD

Github: https://github.com/Vincit/lunch-assistant. All pushes to `main` branch will trigger GitHub Actions Workflow, which deploys app to Azure Function `lunch-basic`.

## Prerequisites

Install Azure CLI and Azure Functions CLI:

- `brew install azure-cli` (or equivalent in other OS)
- `npm install -g azure-functions-core-tools@3 --unsafe-perm true`

Set up following env variables (either in Azure or locally in `.env` file at project root):

- SlackWebHookURL=<not-to-be-committed-to-git>
- RestaurantMenuURL=https://www.compass-group.fi/menuapi/feed/rss/current-week?costNumber=3024&language=fi
- OPENAI_API_URL=https://open-ai-vincit-playgrounds.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-07-01-preview
- OPENAI_API_KEY=<not-tp-be-committed-to-git>

Login to Azure:

`az login`

You have to have permissions to Vincit Azure OpenAI Playground.

## How to use?

- `npm start` - Run locally
- `npm run build` - Build TypeScript into JS
- `npm run test` - Test locally (remember to put secrets into .env AND enable TailScale to access OpenAI)
- `npm run deploy` - Deploy function to Azure (still in preview, other option is via VSCode Azure tools)

## Scheduling

Workdays at 10:30 am. Currently not taking daylight saving time into account, so need to update twice a year or find out how to detect DST.

## Hosting

As Azure Function App called `lunch-basic`. It is running in Basic App Service Plan. Cheaper consumption plan does not allow VNET, which in turn is needed for OpenAI access.

Manual trigger by HTTP GET: http://lunch-premium.azurewebsites.net/api/slack
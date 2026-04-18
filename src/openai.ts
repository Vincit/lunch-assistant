import { AzureOpenAI } from "openai";
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY || "";
const apiVersion = "2025-04-01-preview";
const endpoint = process.env.OPENAI_ENDPOINT || "https://vincit-kuopio-lunchbot.cognitiveservices.azure.com/";
const deployment = process.env.OPENAI_DEPLOYMENT || "gpt-5.1-chat";
const options = { endpoint, apiKey, deployment, apiVersion };

const client = new AzureOpenAI(options);

const prompt = process.argv[2] ?? 'Say this is a test';

const run = async (): Promise<void> => {
    try {
        const response = await client.responses.create({
            model: deployment,
            input: prompt,
        });

        const text = response.output_text ||
            response.output
                ?.flatMap((item: any) => item.content || [])
                .map((part: any) => part.text || '')
                .find((value: string) => typeof value === 'string' && value.trim().length > 0);

        if (text) {
            console.log('OpenAI response:');
            console.log(text);
            return;
        }

        console.log('OpenAI responded but no output_text was found. Full response:');
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.log('Error in OpenAI integration!');
        console.log(error);
    }
};

run();

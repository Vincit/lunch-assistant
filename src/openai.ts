import { queryOpenAI } from "./lib";

const url = process.env.OPENAI_API_URL || '';
const prompt = process.argv[2] ?? 'Say this is a test';

queryOpenAI(url, prompt, 'Test').then((completion) => {
    if (completion) {
        console.log('OpenAI response:');
        console.log(completion);
    }
});

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";

async function huomenta(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Http function was triggered.');
    return { body: 'Huomenta päiviä näläkä olis!' };
};

async function helloLunchChannel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    
    try {
      // Define the URL you want to make a POST request to.
      const apiUrl = "https://hooks.slack.com/services/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";
  
      // Define the payload you want to send in the POST request.
      const payload = {
        text: "Huomenta päiviä Azuresta näläkä olis!",
      };

      const headers = {
        "Content-Type": "application/json",
      };
  
      // Make an HTTP POST request using Axios.
      const response = await axios.post(apiUrl, payload, { headers });
  
      // Handle the response.
      // context.res = {
      //   status: response.status,
      //   body: response.data,
      // };
    } catch (error) {
      // Handle any errors that occur during the request.
      console.log('Error in Slack integration!');
      // context.res = {
      //   status: 500, // Internal Server Error
      //   body: error.message,
    }
    
    return { body: 'Släkkiä spämmätty' };
  }


app.http('lounas', {
    methods: ['GET', 'POST'],
    handler: huomenta
});

app.http('slack', {
  methods: ['GET', 'POST'],
  handler: helloLunchChannel
});
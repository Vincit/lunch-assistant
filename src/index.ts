import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

async function huomenta(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Http function was triggered.');
    return { body: 'Huomenta päiviä näläkä olis!' };
};

app.http('lounas', {
    methods: ['GET', 'POST'],
    handler: huomenta
});
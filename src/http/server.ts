import fastify from "fastify";
import cookie from '@fastify/cookie'
import websocket from "@fastify/websocket";
import { createPool } from "./routes/create-poll";
import { getPool } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-poll";
import { pollResults } from "./ws/poll-results";

const port = 3333;

const app = fastify();

app.register(cookie, {
  secret: 'any_secret',
  hook: 'onRequest'
});
app.register(websocket)

app.register(createPool);
app.register(getPool);
app.register(voteOnPoll);
app.register(pollResults);

app.listen({ port }).then(() => {
  console.log(`Server is running on port ${port}`);
});
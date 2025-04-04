import { expect, test } from "vitest";
import * as node_fetch from "node-fetch";
const fetch = node_fetch.default;
import { readStream } from "../utils"
import { createServer } from 'http';

export const server = createServer((req, res) => {
    // Set headers for chunked response
    res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
    });

    let count = 0;
    const interval = setInterval(() => {
        res.write(`Hello World (${count + 1})\n`);
        count++;

        if (count === 10) {
            clearInterval(interval);
            res.end();
        }
    }, 1000);

    // Handle client disconnect
    res.on('close', () => {
        clearInterval(interval);
    });
});

test("something", async () => {
    server.listen(3000, () => {
        console.log('Server running on http://localhost:3000');
    })
    const response = await fetch("http://localhost:3000");
    const stream = response.body;
    if (!stream) {
        console.error(`${url} empty body on 200 status code`);
        return;
    }
    await readStream(stream);
})

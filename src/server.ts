import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Env } from './types.ts';
import { buildSixfabServer } from './mcp.ts';

const NAME = 'sixfab-mcp';
const VERSION = '1.0.0';

const env: Env = {
  SIXFAB_API_KEY: process.env.SIXFAB_API_KEY ?? '',
  WRITE_PASSPHRASE: process.env.WRITE_PASSPHRASE ?? '',
  SIXFAB_API_BASE: process.env.SIXFAB_API_BASE ?? 'https://api.sixfab.com/v1',
};

const PORT = Number(process.env.PORT ?? 8792);
const HOST = process.env.HOST ?? '0.0.0.0';

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id, mcp-protocol-version');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // Health check
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: NAME, version: VERSION, status: 'healthy' }));
    return;
  }

  // MCP endpoint — stateless: a fresh server + transport per request.
  // Auth is per-tool-call via the passphrase argument (WRITE_PASSPHRASE).
  if (url.pathname === '/mcp') {
    try {
      const body = req.method === 'POST' ? await readBody(req) : undefined;
      const mcp = buildSixfabServer(env);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        transport.close();
        mcp.close();
      });
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      console.error('MCP request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`${NAME} v${VERSION} listening on http://${HOST}:${PORT} (/mcp)`);
});

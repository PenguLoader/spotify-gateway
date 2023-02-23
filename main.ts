import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import * as queryString from "https://deno.land/x/querystring@v1.0.2/mod.js";
import { load } from "https://deno.land/std@0.177.0/dotenv/mod.ts";
import { Base64 } from "https://deno.land/x/bb64@1.1.0/mod.ts";

if (!Deno.env.get('SPOTIFY_CLIENT_ID')) {
  const env = await load();
  for (const k in env) {
    Deno.env.set(k, env[k]);
  }
}

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

const randomString = (length: number) =>
  [...Array(length)].map(() => Math.random().toString(36)[2]).join('');

const callbackMap = new Map<string, string>();

const router = new Router();
router.get('/', ({ response }) => {
  response.body = 'Hello, use GET /login to get your access token :)'
});

router.get('/login', ({ request, response }) => {

  const state = randomString(16);
  const redirectUri = request.url.searchParams.get('redirect_uri');
  const scope = (request.url.searchParams.get('scope') || '').split(' ');

  if (scope.length == 0) {
    scope.push('user-read-private');
    scope.push('user-read-email');
  }

  callbackMap.set(state, redirectUri || '');

  response.redirect('https://accounts.spotify.com/authorize?' + queryString.stringify({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope.join(' '),
    redirect_uri: request.url.origin + '/callback',
    state: state
  }));
});

router.get('/callback', async ({ request, response }) => {

  const code = request.url.searchParams.get('code');
  const state = request.url.searchParams.get('state');

  if (code && state && callbackMap.has(state)) {
    const redirectUri = callbackMap.get(state);
    callbackMap.delete(state);

    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: new URLSearchParams({
        code: code,
        redirect_uri: request.url.origin + '/callback',
        grant_type: 'authorization_code'
      }),
      headers: {
        'Authorization': `Basic ${(Base64.fromString(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString())}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });

    if (resp.ok) {
      const data = await resp.json();

      if (!redirectUri) {
        response.body = data;
      } else {
        response.redirect(queryString.stringifyUrl({
          url: redirectUri!,
          query: {
            data: Base64.fromString(JSON.stringify(data)).toString()
          }
        }));
      }
    } else {
      response.body = 'Failed to get access token.'
    }
  } else {
    response.body = 'Invalid state.'
  }
});

router.get('/refresh', async ({ request, response }) => {
  const refreshToken = request.url.searchParams.get('refresh_token');
  if (refreshToken) {
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: SPOTIFY_CLIENT_ID!
      }),
      headers: {
        'Authorization': `Basic ${(Base64.fromString(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString())}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });

    if (resp.ok) {
      response.body = await resp.text();
    } else {
      response.body = 'Failed to refresh access token.'
    }
  } else {
    response.body = 'Invalid refresh token.'
  }
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener(
  "listen",
  (e) => console.log("Listening on http://localhost:8080"),
);
await app.listen({ port: 8080 });
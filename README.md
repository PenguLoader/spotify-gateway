# spotify-gateway
Spotify auth gateway for League Loader plugins

Try it now: https://spotify.leagueloader.app/login

## Getting started

Create an URL and open it in the web browser.

```js
const sope = ['some-scope', ...];
const redirectUri = 'https://...';

const url = 'https://spotify.leagueloader.app/?scope=' + encodeURIComponent(sope.join(' '))
  + '&redirect_uri=' + encodeURIComponent(redirectUri);
window.open(url);
```
- Check out [scopes here](https://developer.spotify.com/documentation/general/guides/authorization/scopes), leave with empty to access public data only.
- If redirect URI is empty, you will get response directly from `/callback` endpoint and ignore the next step.

After authorized, the web browser will redirect to your set redirect URI. Decode and parse the base64 data to get **access token** and **refresh token**:
```
<your-redirect-uri>?data={base64-data}
```

```json
{
   "access_token": "NgCXRK...MzYjw",
   "token_type": "Bearer",
   "scope": "user-read-private user-read-email",
   "expires_in": 3600,
   "refresh_token": "NgAagA...Um_SHo"
}
```

Access token expires in 3600 seconds (an hour), you should renew it using refresh token. Just make a request to this endpoint:

```http
GET https://spotify.leagueloader.app/refresh?refresh_token=<your-refresh-token>

Response JSON:
{
   "access_token": "NgA6ZcYI...ixn8bUQ",
   "token_type": "Bearer",
   "scope": "user-read-private user-read-email",
   "expires_in": 3600
}
```

## How to build your own server?

1. Fork this repo
2. Create new Deno Deploy project and link to the forked one
3. Add your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to env
4. Deploy!

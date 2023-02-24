# spotify-gateway
Spotify auth gateway for League Loader plugins

Try it now: https://spotify.leagueloader.app/login

## Getting started

Create an URL and open it in the web browser.

```js
const scopes = ['scope-1', 'scope-2', ...];
const redirectURI = 'https://...';

const query = new URLSearchParams({
  scope: scopes.join(' '),
  redirect_uri: redirectURI
});

window.open('https://spotify.leagueloader.app/login?' + query.toString());
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

## League Loader plugin example

Require League Loader v1.0.1 (coming soon).

```js
// Create callback URI with AuthCallback
const callbackURL = AuthCallback.createURL();

// Build token request URL with our gateway
const scopes = [/* put needed scopes here */];
const query = new URLSearchParams({
  scope: scopes.join(' '),
  redirect_uri: callbackURL
});

// League Client will open this URL in web browser
window.open('https://spotify.leagueloader.app/login?' + query.toString());

// Wait for authorized, or 180s (timeout) by default
const response = await AuthCallback.readResponse(callbackURL /*, 180000 */);

if (response === null) {
  // handle timeout/error
} else {
  const params = new URLSearchParams(response);
  const data = JSON.parse(window.atob(params.get('data')));
  if (data.access_token) {
    // found access token
  } else {
    // fail
  }
}
```

## How to build your own server?

1. Fork this repo
2. Create new Deno Deploy project and link to the forked one
3. Add your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to env
4. Deploy!

// /callback
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { code: string };
  }
) {
  const data = {
    code: params.code,
    client_id: process.env.TRAKT_CLIENT_ID,
    client_secret: process.env.TRAKT_CLIENT_SECRET,
    redirect_uri: process.env.TRAKT_REDIRECT_URI,
    grant_type: 'authorization_code',
  };

  const response = await fetch('https://api.trakt.tv/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await response.json();
  
}
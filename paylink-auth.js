const BASE_URL = "https://integration.apitest.paylink.am";

let cachedToken = null;
let tokenExpiry = null;

export async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}/api/authorization/authorize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerId: process.env.PAYLINK_PARTNER_ID,
      partnerKey: process.env.PAYLINK_PARTNER_KEY,
    }),
  });

  if (!res.ok) {
    throw new Error(`PayLink auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.accessToken.token;
  tokenExpiry = new Date(data.accessToken.expiration).getTime();

  return cachedToken;
}

export { BASE_URL };

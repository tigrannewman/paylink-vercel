import { getAccessToken, BASE_URL } from "@/lib/paylink-auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, productName, price } = body;

    if (!email || !productName || !price) {
      return Response.json(
        { error: "Missing required fields: email, productName, price" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return Response.json(
        { error: "Invalid price" },
        { status: 400, headers: corsHeaders }
      );
    }

    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/api/request/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestInfo: `${productName} — ${email}`,
        requestType: "Payment",
        amount: parseFloat(price),
        currency: "USD",
        backUrl: "https://paytedzee.webflow.io/success",
        isActive: true,
        allowAnonymous: false,
        isFlexible: false,
        language: "en",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.detail || "PayLink error" },
        { status: res.status, headers: corsHeaders }
      );
    }

    return Response.json(data, { headers: corsHeaders });
  } catch (err) {
    console.error("create-payment error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

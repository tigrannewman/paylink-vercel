import { getAccessToken, BASE_URL } from "@/lib/paylink-auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const { email, productName, price } = body;

    if (!email || !productName || !price) {
      return Response.json(
        { error: "Missing required fields: email, productName, price" },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return Response.json({ error: "Invalid price" }, { status: 400 });
    }

    const token = await getAccessToken();

    const backUrl = "https://paytedzee.webflow.io/success";

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
        backUrl,
        isActive: true,
        allowAnonymous: true,
        isFlexible: false,
        language: "en",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.detail || "PayLink error" }, { status: res.status });
    }

    // Returns { requestId, redirectUrl }
    return Response.json(data);
  } catch (err) {
    console.error("create-payment error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getAccessToken, BASE_URL } from "@/lib/paylink-auth";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { amount, currency, requestInfo, backUrl } = body;
    if (!amount || !currency || !requestInfo || !backUrl) {
      return Response.json(
        { error: "Missing required fields: amount, currency, requestInfo, backUrl" },
        { status: 400 }
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
        requestInfo,
        requestType: body.requestType || "Payment",
        amount,
        currency,
        backUrl,
        isActive: true,
        allowAnonymous: body.allowAnonymous ?? true,
        isFlexible: body.isFlexible ?? false,
        language: body.language || "en",
        // Optional fields
        ...(body.amountMin && { amountMin: body.amountMin }),
        ...(body.amountMax && { amountMax: body.amountMax }),
        ...(body.maxCount && { maxCount: body.maxCount }),
        ...(body.expirationDate && { expirationDate: body.expirationDate }),
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

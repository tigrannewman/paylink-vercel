import { getAccessToken, BASE_URL } from "@/lib/paylink-auth";
import { kv } from "@vercel/kv";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing payment id" }, { status: 400 });
    }

    const token = await getAccessToken();

    // PayLink sends orderId (integer) via backUrl callback
    // but requestId (UUID) is what we have at registration time.
    // Try orderId first, fall back to requestId.
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);

    let payment = null;

    if (!isUUID) {
      // Looks like an orderId — query by order
      const res = await fetch(
        `${BASE_URL}/api/payment/get-by-order-id?id=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        payment = Array.isArray(data) ? data[0] : data;
      }
    } else {
      // Looks like a requestId (UUID) — query by request
      const res = await fetch(
        `${BASE_URL}/api/payment/${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        payment = Array.isArray(data) ? data[0] : data;
      }
    }

    if (!payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    // Look up original Webflow form submission from KV
    const requestId = payment.requestId || (isUUID ? id : null);
    const submission = requestId
      ? await kv.get(`submission:${requestId}`)
      : null;

    return Response.json({
      orderId: payment.orderId,
      requestId: payment.requestId,
      paymentStatus: payment.paymentStatus,
      paymentApproved: payment.paymentApproved,
      amount: payment.amount,
      currency: payment.currency,
      customerName: payment.customerName,
      paymentDate: payment.paymentDate,
      paymentId: payment.paymentId,
      // Merged from Webflow form submission stored in KV
      customerEmail: payment.customerEmail || submission?.email || null,
      productName: submission?.productName || null,
      submittedAt: submission?.submittedAt || null,
    });
  } catch (err) {
    console.error("payment-result error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

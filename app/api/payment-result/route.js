import { getAccessToken, BASE_URL } from "@/lib/paylink-auth";
import { kv } from "@vercel/kv";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return Response.json({ error: "Missing payment id" }, { status: 400 });
    }

    const token = await getAccessToken();

    const res = await fetch(
      `${BASE_URL}/api/payment/get-by-order-id?id=${encodeURIComponent(orderId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      return Response.json({ error: "Payment not found" }, { status: res.status });
    }

    const data = await res.json();
    const payment = Array.isArray(data) ? data[0] : data;

    // Look up the original Webflow form submission using requestId
    const submission = payment.requestId
      ? await kv.get(`submission:${payment.requestId}`)
      : null;

    return Response.json({
      orderId: payment.orderId,
      paymentStatus: payment.paymentStatus,
      paymentApproved: payment.paymentApproved,
      amount: payment.amount,
      currency: payment.currency,
      customerName: payment.customerName,
      paymentDate: payment.paymentDate,
      paymentId: payment.paymentId,
      // Merged from Webflow form submission
      customerEmail: payment.customerEmail || submission?.email || null,
      productName: submission?.productName || null,
      submittedAt: submission?.submittedAt || null,
    });
  } catch (err) {
    console.error("payment-result error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

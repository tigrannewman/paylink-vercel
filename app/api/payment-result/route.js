import { getAccessToken, BASE_URL } from "@/lib/paylink-auth";

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

    // data is an array — return the first (most recent) payment
    const payment = Array.isArray(data) ? data[0] : data;

    return Response.json({
      orderId: payment.orderId,
      paymentStatus: payment.paymentStatus,
      paymentApproved: payment.paymentApproved,
      amount: payment.amount,
      currency: payment.currency,
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      paymentDate: payment.paymentDate,
      paymentId: payment.paymentId,
    });
  } catch (err) {
    console.error("payment-result error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import type { OrderRefund } from "@/types/order";

export function getItemRefunds(refunds: OrderRefund[] | undefined, itemId: number) {
  const byId = new Map((refunds ?? []).map((refund) => [refund.id, refund]));
  return (refunds ?? []).flatMap((refund) => {
    const allocation = refund.items.find((item) => item.order_item_id === itemId);
    if (!allocation) return [];
    const settlement = refund.settled_by_refund_id
      ? byId.get(refund.settled_by_refund_id)
      : undefined;
    return [{
      ...refund,
      amount: allocation.amount,
      quantity: allocation.quantity,
      status: settlement?.status ?? refund.status,
      method: settlement?.method ?? refund.method,
      issued_at: settlement?.issued_at ?? refund.issued_at,
    }];
  });
}

import { clsx } from "clsx";

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-obsidian-100 text-obsidian-600",
  PAYMENT_CONFIRMED: "bg-gold/10 text-gold-muted",
  IN_PRODUCTION: "bg-blue-50 text-blue-700",
  QUALITY_CHECK: "bg-purple-50 text-purple-700",
  READY_FOR_DELIVERY: "bg-green-50 text-green-700",
  OUT_FOR_DELIVERY: "bg-teal-50 text-teal-700",
  DELIVERED: "bg-success/10 text-success",
  CANCELLED: "bg-error/10 text-error",
  REFUNDED: "bg-obsidian-100 text-obsidian-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  IN_PRODUCTION: "In Production",
  QUALITY_CHECK: "Quality Check",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 font-sans text-xs tracking-wider uppercase",
        STATUS_STYLES[status] ?? "bg-obsidian-100 text-obsidian",
      )}
    >
      {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

import { api } from "./client";

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  variantId?: string;
  variantLabel?: string;
  fabricOptionId?: string;
  fabricName?: string;
  fabricColor?: string;
  fabricNote?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode?: string;
  phone: string;
}

export async function createOrder(items: CartItem[], shippingAddress: ShippingAddress, notes?: string) {
  return api.post<{ id: string; orderNumber: string; totalAmount: string }>("/orders", {
    items: items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
      fabricOptionId: i.fabricOptionId,
      fabricColor: i.fabricColor,
      fabricNote: i.fabricNote,
    })),
    shippingAddress,
    notes,
  });
}

export async function initiatePayment(orderId: string) {
  return api.post<
    | {
        flow: "redirect";
        provider: "paystack";
        authorizationUrl: string;
        reference: string;
      }
    | {
        flow: "manual";
        provider: "manual";
        reference: string;
        message: string;
        bankName: string;
        accountName: string;
        accountNumber: string;
        transferReference: string;
        contactEmail?: string;
        contactWhatsApp?: string;
      }
  >("/payments/initiate", { orderId });
}

export async function fetchMyOrders(page = 1) {
  return api.get<{
    orders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: string;
      currency: string;
      createdAt: string;
      items: Array<{ productName: string; quantity: number }>;
    }>;
    meta: { total: number; totalPages: number };
  }>(`/users/me/orders?page=${page}`);
}

export async function fetchOrder(id: string) {
  return api.get<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    shippingAddress: ShippingAddress;
    items: CartItem[];
    timeline: Array<{ status: string; note: string | null; createdAt: string }>;
    payment: { status: string; paidAt: string | null } | null;
  }>(`/orders/${id}`);
}

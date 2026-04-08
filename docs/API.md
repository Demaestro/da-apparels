# DA Apparels — API Reference

Base URL: `https://api.da-apparels.com/api/v1`

All protected routes require: `Authorization: Bearer <access_token>`

---

## Auth

| Method | Endpoint                  | Auth | Description                          |
|--------|---------------------------|------|--------------------------------------|
| POST   | /auth/register            | —    | Create account + send verify email   |
| POST   | /auth/login               | —    | Returns access token + sets refresh HttpOnly cookie |
| POST   | /auth/refresh             | —    | Rotate refresh token → new access token |
| POST   | /auth/logout              | ✓    | Invalidate session                   |
| POST   | /auth/forgot-password     | —    | Send reset link                      |
| POST   | /auth/reset-password      | —    | Consume token + set new password     |

---

## Users / Vault

| Method | Endpoint                  | Auth | Role      | Description                    |
|--------|---------------------------|------|-----------|--------------------------------|
| GET    | /users/me                 | ✓    | CUSTOMER+ | Get own profile                |
| PATCH  | /users/me/profile         | ✓    | CUSTOMER+ | Update name, phone, address    |
| GET    | /users/me/measurements    | ✓    | CUSTOMER+ | Decrypt + return measurements  |
| PUT    | /users/me/measurements    | ✓    | CUSTOMER+ | Encrypt + store measurements   |
| GET    | /users/me/orders          | ✓    | CUSTOMER+ | Order history                  |

---

## Products

| Method | Endpoint                        | Auth | Role   | Description                        |
|--------|---------------------------------|------|--------|------------------------------------|
| GET    | /products                       | —    | —      | List products (filter/paginate)    |
| GET    | /products/:slug                 | —    | —      | Product detail + fabric options    |
| GET    | /products/recommended           | ✓    | —      | Style-quiz-matched recommendations |
| POST   | /products                       | ✓    | ADMIN+ | Create product                     |
| PATCH  | /products/:id                   | ✓    | ADMIN+ | Update product                     |
| POST   | /products/:id/images            | ✓    | ADMIN+ | Upload image → Cloudinary          |
| DELETE | /products/:id/images/:imageId   | ✓    | ADMIN+ | Remove image                       |

---

## Style Quiz

| Method | Endpoint                  | Auth | Description                                   |
|--------|---------------------------|------|-----------------------------------------------|
| GET    | /style-quiz/questions     | —    | Return quiz questions                         |
| POST   | /style-quiz/submit        | ✓    | Store result + return matched product IDs     |
| GET    | /style-quiz/result        | ✓    | Get own latest quiz result                    |

---

## Orders

| Method | Endpoint                        | Auth | Role   | Description                        |
|--------|---------------------------------|------|--------|------------------------------------|
| POST   | /orders                         | ✓    | —      | Create order (draft)               |
| GET    | /orders/:id                     | ✓    | —      | Get own order detail               |
| PATCH  | /orders/:id/schedule-delivery   | ✓    | —      | Set delivery date + slot           |
| PATCH  | /orders/:id/status              | ✓    | STAFF+ | Update order status (triggers BullMQ email) |
| GET    | /orders/:id/timeline            | ✓    | —      | Full status timeline               |

---

## Payments

| Method | Endpoint                    | Auth | Description                          |
|--------|-----------------------------|------|--------------------------------------|
| POST   | /payments/initiate          | ✓    | Init Paystack/Flutterwave transaction |
| POST   | /payments/webhook/paystack  | —    | Paystack webhook (HMAC-verified)     |

---

## Admin / CRM

| Method | Endpoint                        | Auth | Role   | Description                              |
|--------|---------------------------------|------|--------|------------------------------------------|
| GET    | /admin/crm/analytics            | ✓    | ADMIN+ | Revenue, AOV, top products, customer LTV |
| GET    | /admin/crm/customers            | ✓    | ADMIN+ | Customer list with order counts + value  |
| GET    | /admin/crm/customers/:id        | ✓    | ADMIN+ | Customer profile + order history         |
| GET    | /admin/orders                   | ✓    | STAFF+ | All orders (filter by status)            |
| GET    | /admin/fabric-tracking          | ✓    | STAFF+ | Fabric selection frequency analytics     |
| POST   | /admin/notifications/trigger    | ✓    | ADMIN+ | Manually trigger notification to user    |

---

## Response Envelope

All responses follow this shape:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Must be a valid email address"]
  }
}
```

# Daraz Order Tracker

A simple backend to track Daraz seller orders with statuses:
- `Pending`
- `Shipping`
- `Delivered`
- `Failed`
- `Return`

## Setup

1. Open a terminal in `c:\Users\shahu\Desktop\Daraz_Store\Server`
2. Run `npm install`
3. Start the server with `npm start`

## API Endpoints

- `GET /orders` - list all orders
- `GET /orders?status=Shipping` - filter orders by status
- `GET /orders/:id` - get single order
- `POST /orders` - create order
  - body: `{ "darazOrderId": "123", "customerName": "Ali", "status": "Shipping" }`
- `PUT /orders/:id/status` - update order status
  - body: `{ "status": "Delivered" }`
- `GET /statuses` - list allowed statuses

## Example

Create an order:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"darazOrderId":"D12345","customerName":"Rahim","status":"Shipping"}'
```

Update status:

```bash
curl -X PUT http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Delivered"}'
```

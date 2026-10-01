# GTM Sample Shop

A fake static storefront for testing Google Tag Manager → Meta, both browser
(Pixel) and server-side (Conversions API). No backend; nothing ships.

Live: https://samandaloro.github.io/gtm-sample-shop/ · Web container: `GTM-MHVJKCFN`

## dataLayer events

Events follow the GA4 ecommerce schema. Each push looks like:

```js
{
  event: 'add_to_cart',
  ecommerce: { currency: 'USD', value: 129, items: [{ item_id, item_name, item_brand, item_category, price, quantity }] },
  user_data: { email, phone_number, address: { first_name, last_name, street, city, region, postal_code, country } } // checkout + purchase only
}
```

| Where | dataLayer event | Meta standard event |
| --- | --- | --- |
| Home | `view_item_list`, `select_item` | — |
| Product page | `view_item` | `ViewContent` |
| Add to cart button | `add_to_cart` | `AddToCart` |
| Cart | `view_cart`, `remove_from_cart` | — |
| Checkout page load | `begin_checkout` | `InitiateCheckout` |
| Checkout step 1 | `add_shipping_info` (+ `user_data`) | — |
| Place order | `add_payment_info` (+ `user_data`) | `AddPaymentInfo` |
| Thank-you page | `purchase` (+ `user_data`, `transaction_id`) | `Purchase` |

`purchase` fires once per order (refreshing the thank-you page does not repeat
it) and carries the order number as `ecommerce.transaction_id`. Events are also
logged to the browser console as `[dataLayer] …`.

The site pushes raw data only. It does not set an event ID for Pixel /
Conversions API deduplication; that is configured in GTM.

Use made-up customer details at checkout ("Fill test data" does it for you).
`user_data` is pushed in plain text; the Meta tags hash it before sending.

## GTM setup outline

**Web container**

1. Data Layer Variables: `ecommerce.value`, `ecommerce.currency`,
   `ecommerce.items`, `ecommerce.transaction_id`, `user_data`.
2. Custom Event triggers, one per event name in the table above.
3. Browser side: a Meta Pixel tag per event, with an event ID you define in
   GTM (e.g. the transaction ID for purchase).
4. Server side transport: a Google tag with `server_container_url` set to your
   tagging server, plus GA4 event tags on the same triggers that forward the
   same event ID and `user_data` as parameters.

**Server container**

1. GA4 client (default) to claim the incoming requests.
2. Meta Conversions API tag (Community Template Gallery) with your Pixel ID,
   an access token from Events Manager, and a Test Event Code while testing.
3. Confirm the tag sends the same event ID the Pixel sent.

**Verify**

- GTM Preview mode on both containers.
- Meta Events Manager → Test Events: each event should show once from
  "Browser" and once from "Server", marked deduplicated.

Note: on `github.io` the tagging server is a different site from the shop, so
first-party cookies such as `_fbp` / `_fbc` do not reach it automatically. Fine
for learning the flow; a custom domain with a tagging subdomain fixes it.

## Run locally

```sh
python3 -m http.server 8765
```

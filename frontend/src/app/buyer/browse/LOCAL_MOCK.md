# Temporary Cornell Wushu fundraiser

Run `pnpm --filter frontend dev` and open http://localhost:8080/buyer/browse.
Select Wushu Sweet Treats (temporary placeholder) in Cards, or select November 16,
2026 in Calendar and click its preview card. Direct detail URL:
http://localhost:8080/buyer/fundraiser/00000000-0000-4000-8000-000000000001

This uses the existing detail page, item cards, desktop item dialogs, mobile item
route, quantity selectors, and cart sidebar. Edit the existing components under
`src/app/buyer/fundraiser/[id]` to redesign them with normal Next development hot
reload. The main photo is `public/images/wushu-bake-sale.png`; item images use
existing empty-image placeholders.

The server-only fixture lives in `src/lib/local-mocks/fundraiser.ts` and validates
against CompleteFundraiserSchema and ItemWithAvailabilitySchema. Its organization
is approved only in memory. The pickup is November 16, 2026, noon–6 PM Eastern,
at Statler Lobby. The placeholder buying period is November 9, 9 AM through
November 16, 6 PM Eastern. Existing date components display in the browser's
local timezone. Existing expired-fundraiser behavior applies after the pickup.

Tanghulu ($1), cinnamon sugar doughnut muffins ($2), and tiramisu ($3) have
TEST PRICE labels and descriptions identifying them as placeholders. These are
not actual prices. No confirmed orders, referrals, or announcements are invented.
Cart selections use the existing browser localStorage store, never the database.
Referral signup is omitted,
checkout is disabled, and direct cart/checkout visits for the reserved fixture ID
redirect to the detail page before auth/API calls. No mock purchase flow exists.

The fixture is selected only with NODE_ENV=development and a request Host of
localhost, 127.0.0.1, or [::1]. Production and other hosts use normal data loading.
Real fundraisers keep their existing data and authorization behavior. Browse
still requires successful backend reads; fixture detail/item data does not.

To disable, restart the frontend with:

```sh
LOCAL_MOCK_FUNDRAISER=false pnpm --filter frontend dev
```

To remove before merging:

- Remove the fixture imports and injection block in `buyer/browse/page.tsx`.
- Remove fixture selection, referral condition, and `localMock` prop in
  `buyer/fundraiser/[id]/page.tsx`, restoring its two normal API reads.
- Remove the `localMock` prop, notice, and checkout guards in FundraiserCartSidebar.
- Remove the reserved-ID imports/redirects in the cart and checkout page routes.
- Restore `item/[itemId]/page.tsx` from ItemPageClient.tsx; remove its mockItems prop
  and conditional fixture lookup, then delete ItemPageClient.tsx.
- Delete `src/lib/local-mocks` and this document.
- Delete `public/images/wushu-bake-sale.png` if it is no longer needed.

Optional browser cleanup: remove only key `00000000-0000-4000-8000-000000000001`
from the `state.carts` object in localStorage's `fundraiser-cart-storage` value.
Other carts can be retained. No database cleanup is needed.

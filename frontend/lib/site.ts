// Master switch for online ordering (cart, checkout and occasion/gift orders).
// Enabled by default. Set NEXT_PUBLIC_SHOP_ENABLED="false" and backend
// SHOP_ENABLED="false" to pause ordering, then redeploy both apps.
export const SHOP_ENABLED = process.env.NEXT_PUBLIC_SHOP_ENABLED !== 'false';

// The only contact number shown on the site.
export const SITE_PHONE = '۰۹۱۹۸۳۰۲۳۰۲';

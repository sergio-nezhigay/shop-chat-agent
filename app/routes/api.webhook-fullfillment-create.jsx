// Environment variables needed:
// SHOPIFY_SHOP_DOMAIN - your shop domain (e.g., "myshop.myshopify.com")
// SHOPIFY_ACCESS_TOKEN - your private app access token
//This route processes incoming Shopify webhooks for fulfillment creation, logging key data and optionally fetching shop info via Admin API.
// * Part of the shop-chat-agent app (a Remix-based Shopify app for AI-powered storefront chat, per #codebase CLAUDE.md and README.md).

//api.webhook-fullfillment-create.jsx route

export async function action({ request }) {
  const webhookPayload = await request.text();
  console.log("webhookPayload", JSON.stringify(webhookPayload, null, 2));
  let fulfillmentData;

  try {
    fulfillmentData = JSON.parse(webhookPayload);
    console.log("fulfillmentData", JSON.stringify(fulfillmentData, null, 2));
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
    },
  );
}

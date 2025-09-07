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
      headers: getCorsHeaders(request),
    });
  }

  await processFulfillmentWebhook(fulfillmentData);
  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
    },
  );

  // Admin API usage: fetch shop info and order details
  //  try {
  //    await fetchShopInfo();

  //    return new Response(
  //      JSON.stringify({
  //        success: true,
  //        fulfillment_id: fulfillmentData.id,
  //      }),
  //      {
  //        status: 200,
  //        headers: getCorsHeaders(request),
  //      },
  //    );
  //  } catch (error) {
  //    console.error("Admin API error:", error);
  //    return new Response(
  //      JSON.stringify({
  //        success: true,
  //        fulfillment_processed: true,
  //        admin_api_error: error.message,
  //      }),
  //      {
  //        status: 200,
  //        headers: getCorsHeaders(request),
  //      },
  //    );
  //  }
}

async function processFulfillmentWebhook(data) {
  console.log("data", JSON.stringify(data, null, 2));
  console.log("Fulfillment ID:", data.id);
  console.log("Order ID:", data.order_id);
  console.log("Status:", data.status);
  console.log("Created at:", data.created_at);
  console.log("Updated at:", data.updated_at);
}

async function fetchShopInfo() {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    throw new Error("Missing Shopify credentials in environment variables");
  }

  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/shop.json`,
    {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Shop API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const fetchedShopData = await response.json();
  console.log("fetchedShopData", JSON.stringify(fetchedShopData, null, 2));
  return fetchedShopData.shop;
}

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
  };
}

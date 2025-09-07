import { json } from "@remix-run/node";
import { getConversationHistory } from "../db.server";

/**
 * Loader to fetch and log test data
 */
export async function loader({ request }) {
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");

  if (!conversationId) {
    return json(
      { error: "Missing conversationId query parameter." },
      { status: 400 },
    );
  }

  try {
    const messages = await getConversationHistory(conversationId);

    // Log to console (server-side)
    console.log("Logged data for conversation:", conversationId, messages);

    return json({
      success: true,
      conversationId,
      messages,
    });
  } catch (error) {
    console.error("Error fetching test data:", error);
    return json({ error: "Failed to fetch test data." }, { status: 500 });
  }
}

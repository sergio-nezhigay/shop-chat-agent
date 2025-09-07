import { json } from "@remix-run/node";
import { saveMessage } from "../db.server";

/**
 * Loader to insert test data
 */
export async function loader({ request }) {
  // Generate a test conversation ID
  const testConversationId = "test-conversation-" + Date.now();

  try {
    // Insert sample messages
    await saveMessage(
      testConversationId,
      "user",
      "Hello, this is a test message from user.",
    );
    await saveMessage(
      testConversationId,
      "assistant",
      "Hi! This is a test response from assistant.",
    );
    await saveMessage(testConversationId, "user", "Another test message.");

    return json({
      success: true,
      message: "Test data inserted successfully.",
      conversationId: testConversationId,
    });
  } catch (error) {
    console.error("Error inserting test data:", error);
    return json({ error: "Failed to insert test data." }, { status: 500 });
  }
}

/**
 * Action for POST requests (optional, mirrors loader)
 */
export async function action({ request }) {
  return loader({ request });
}

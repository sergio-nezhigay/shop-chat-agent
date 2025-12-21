import { useLoaderData } from "@remix-run/react";

import prisma from "../db.server";

export const loader = async ({ request }) => {
  console.log("api.debug-db loader request", JSON.stringify(request, null, 2));
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `;
  console.log("tables", JSON.stringify(tables, null, 2));

  // Fetch last 5 sessions
  const sessions = await prisma.session.findMany({
    take: 5,
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
      shop: true,
    },
  });
  console.log("last 5 sessions", JSON.stringify(sessions, null, 2));

  // Fetch conversations with message counts
  const conversations = await prisma.conversation.findMany({
    take: 10,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      messages: {
        take: 3,
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  // Fetch customer tokens
  const tokens = await prisma.customerToken.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      conversationId: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  // Get counts
  const counts = {
    sessions: await prisma.session.count(),
    conversations: await prisma.conversation.count(),
    messages: await prisma.message.count(),
    tokens: await prisma.customerToken.count(),
    codeVerifiers: await prisma.codeVerifier.count(),
  };

  return {
    tables: tables.map((t) => t.name),
    sessions,
    conversations,
    tokens,
    counts,
  };
};

export default function DebugDb() {
  const { tables, sessions, conversations, tokens, counts } = useLoaderData();

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Database Statistics</h1>
      <ul>
        <li>Sessions: {counts.sessions}</li>
        <li>Conversations: {counts.conversations}</li>
        <li>Messages: {counts.messages}</li>
        <li>Customer Tokens: {counts.tokens}</li>
        <li>Code Verifiers: {counts.codeVerifiers}</li>
      </ul>

      <h1>Database Tables</h1>
      <ul>
        {tables.map((table, index) => (
          <li key={index}>{table}</li>
        ))}
      </ul>

      <h1>Last 5 Sessions</h1>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>Shop: {session.shop}</li>
        ))}
      </ul>

      <h1>Recent Conversations (Last 10)</h1>
      {conversations.map((conv) => (
        <div
          key={conv.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>ID:</strong> {conv.id}
          <br />
          <strong>Messages:</strong> {conv._count.messages}
          <br />
          <strong>Updated:</strong> {new Date(conv.updatedAt).toLocaleString()}
          <br />
          <strong>Sample Messages (first 3):</strong>
          <ul>
            {conv.messages.map((msg, idx) => (
              <li key={idx}>
                <strong>{msg.role}:</strong> {msg.content.substring(0, 100)}
                {msg.content.length > 100 ? "..." : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h1>Customer Tokens (Last 10)</h1>
      <ul>
        {tokens.map((token) => (
          <li key={token.id}>
            Conversation: {token.conversationId} | Expires:{" "}
            {new Date(token.expiresAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

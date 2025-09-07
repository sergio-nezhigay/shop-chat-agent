import { useLoaderData } from "@remix-run/react";

import prisma from "../db.server";

export const loader = async ({ request }) => {
  console.log("api.debug-db loader request", JSON.stringify(request, null, 2));
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `;
  console.log("tables", JSON.stringify(tables, null, 2));

  // Added: Fetch last 5 sessions
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

  return { tables: tables.map((t) => t.name), sessions };
};

export default function DebugDb() {
  const { tables, sessions } = useLoaderData();

  return (
    <div>
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
    </div>
  );
}

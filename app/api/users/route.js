import { getUsers, createUser } from "@/app/lib/db.server";

export async function GET() {
  const users = await getUsers();
  return new Response(JSON.stringify({ users }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const created = await createUser(body);
  return new Response(JSON.stringify({ created }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
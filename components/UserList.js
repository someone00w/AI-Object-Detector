// ...existing code...
"use client";

import { useState } from "react";

export default function UserList() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const { users } = await res.json();
      setUsers(users);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={loadUsers}
        className="px-4 py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Show Users"}
      </button>

      {error && <div className="mt-2 text-red-600">Error: {error}</div>}

      {users && (
        <ul className="mt-4 space-y-2">
          {users.map((u) => (
            <li key={u.id} className="p-2 border rounded">
              <div><strong>ID:</strong> {u.id}</div>
              <div><strong>Name:</strong> {u.name ?? "—"}</div>
              <div><strong>Email:</strong> {u.email ?? "—"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
// ...existing code...
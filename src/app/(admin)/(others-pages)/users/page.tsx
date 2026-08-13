"use client";

import { API_USERS_ADMIN } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  username: string;
  fullname?: string;
  mail?: string;
  is_admin?: boolean;
  is_premium?: boolean;
  is_locked?: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    is_admin: false,
    is_premium: false,
  });
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<UserRow[]>(API_USERS_ADMIN.LIST);
      setUsers(res.data ?? []);
      setError(null);
    } catch {
      setError("Không tải được danh sách user.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post(API_USERS_ADMIN.CREATE, form);
      setMsg("Đã tạo tài khoản.");
      setForm({ username: "", password: "", is_admin: false, is_premium: false });
      await load();
    } catch {
      setMsg("Tạo thất bại (username trùng hoặc validation).");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Người dùng
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Không mở đăng ký công khai — chỉ admin tạo tài khoản.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
          {error}
        </p>
      )}

      <form
        onSubmit={createUser}
        className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-semibold">Tạo tài khoản</h2>
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_admin}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_admin: e.target.checked }))
            }
          />
          Admin
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_premium}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_premium: e.target.checked }))
            }
          />
          Premium
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Tạo
        </button>
        {msg && <p className="sm:col-span-2 text-sm text-gray-600">{msg}</p>}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Quyền</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-gray-50 dark:border-gray-800"
              >
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.mail || "—"}</td>
                <td className="px-4 py-3">
                  {u.is_admin ? "Admin" : u.is_premium ? "Premium" : "User"}
                </td>
                <td className="px-4 py-3">
                  {u.is_locked ? "Khóa" : "Active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { API_USERS_ADMIN } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  username: string;
  fullname?: string;
  mail?: string;
  phone_number?: string;
  raw_password?: string;
  is_admin?: boolean;
  is_premium?: boolean;
  is_locked?: boolean;
  created_at?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullname: "",
    phone_number: "",
    mail: "",
    is_admin: false,
    is_premium: false,
  });

  const toggleShowPassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const load = async () => {
    try {
      console.log("[AUTH] Đang tải danh sách người dùng...");
      const res = await api.get<UserRow[]>(API_USERS_ADMIN.LIST);
      const data = res.data ?? [];
      setUsers(data);
      console.log(`[AUTH] Đã tải thành công ${data.length} người dùng`);
      setError(null);
    } catch (err) {
      console.error("[AUTH] Lỗi tải danh sách người dùng", err);
      setError("Không tải được danh sách người dùng.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setCreating(true);
    try {
      console.log("[AUTH] Đang tạo tài khoản người dùng username=" + form.username);
      await api.post(API_USERS_ADMIN.CREATE, {
        username: form.username.trim(),
        password: form.password,
        fullname: form.fullname.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        mail: form.mail.trim() || undefined,
        is_admin: form.is_admin,
        is_premium: form.is_premium,
      });
      console.log("[AUTH] Đã tạo tài khoản thành công username=" + form.username);
      setMsg(`Đã tạo tài khoản "${form.username}" thành công.`);
      setForm({
        username: "",
        password: "",
        fullname: "",
        phone_number: "",
        mail: "",
        is_admin: false,
        is_premium: false,
      });
      setShowModal(false);
      await load();
    } catch (err: any) {
      console.error("[AUTH] Tạo tài khoản thất bại", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.username?.[0] ||
        err?.response?.data?.errors?.phone_number?.[0] ||
        "Tạo tài khoản thất bại (kiểm tra lại trùng lặp hoặc validation).";
      alert(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.fullname || "").toLowerCase().includes(q) ||
      (u.phone_number || "").toLowerCase().includes(q) ||
      (u.mail || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Quản lý Người dùng & Đại lý
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý tài khoản quản trị viên, đại lý phân phối và tra cứu mật khẩu phục vụ hỗ trợ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition shadow-sm"
          >
            ➕ Thêm Người Dùng / Đại Lý
          </button>
        </div>
      </div>

      {msg && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="🔍 Tìm username, họ tên, SĐT, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Tổng cộng: <b>{filteredUsers.length}</b> tài khoản
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-950/30">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Tên đăng nhập</th>
              <th className="px-4 py-3">Họ tên / Đại lý</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Mật khẩu</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  Không tìm thấy tài khoản nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                >
                  <td className="px-4 py-3 text-xs text-gray-400">{u.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {u.username}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {u.fullname || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {u.phone_number || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {u.raw_password ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {showPasswords[u.id] ? u.raw_password : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(u.id)}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition"
                        >
                          {showPasswords[u.id] ? "Ẩn" : "👁 Hiện"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {u.mail || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.is_admin ? (
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                        Đại lý / User
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.is_locked ? (
                      <span className="rounded-md bg-error-50 px-2 py-0.5 font-bold text-error-700 dark:bg-error-950/40 dark:text-error-300">
                        Đã khóa
                      </span>
                    ) : (
                      <span className="rounded-md bg-success-50 px-2 py-0.5 font-bold text-success-700 dark:bg-success-950/40 dark:text-success-300">
                        Hoạt động
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm người dùng / Đại lý */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateUser}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tạo Tài Khoản Người Dùng / Đại Lý
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tên đăng nhập (Username) <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="agency_hanoi"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Mật khẩu khởi tạo <span className="text-error-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Họ và tên / Tên Đại lý
                </label>
                <input
                  type="text"
                  placeholder="Đại Lý Miền Bắc - Nguyễn Văn A"
                  value={form.fullname}
                  onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  placeholder="agency@example.com"
                  value={form.mail}
                  onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Quản trị viên (Admin)
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_premium}
                  onChange={(e) => setForm((f) => ({ ...f, is_premium: e.target.checked }))}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Tài khoản Premium
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition shadow disabled:opacity-50"
              >
                {creating ? "Đang tạo..." : "Xác nhận tạo tài khoản"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

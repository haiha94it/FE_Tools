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

  // Reset Password Modal State
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const openResetModal = (u: UserRow) => {
    setResetUser(u);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetError(null);
  };

  const closeResetModal = () => {
    setResetUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetError(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetError(null);

    if (newPassword.length < 6) {
      setResetError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Xác nhận mật khẩu không khớp với mật khẩu mới.");
      return;
    }

    setResetting(true);
    try {
      console.log(`[AUTH] Đang đặt lại mật khẩu cho user ID=${resetUser.id} (${resetUser.username})...`);
      await api.post(API_USERS_ADMIN.RESET_PASSWORD(resetUser.id), {
        new_password: newPassword,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === resetUser.id ? { ...u, raw_password: newPassword } : u))
      );
      setMsg(`Đã đổi mật khẩu cho tài khoản "${resetUser.username}" thành công.`);
      closeResetModal();
    } catch (err: unknown) {
      console.error("[AUTH] Đổi mật khẩu thất bại", err);
      const errorObj = err as { response?: { data?: { message?: string; detail?: string } } };
      const errorMsg =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.detail ||
        "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      setResetError(errorMsg);
    } finally {
      setResetting(false);
    }
  };

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
    let ignore = false;
    api
      .get<UserRow[]>(API_USERS_ADMIN.LIST)
      .then((res) => {
        if (!ignore) {
          setUsers(res.data ?? []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("[AUTH] Lỗi tải danh sách người dùng", err);
          setError("Không tải được danh sách người dùng.");
        }
      });
    return () => {
      ignore = true;
    };
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
    } catch (err: unknown) {
      console.error("[AUTH] Tạo tài khoản thất bại", err);
      const errorObj = err as {
        response?: {
          data?: {
            message?: string;
            errors?: { username?: string[]; phone_number?: string[] };
          };
        };
      };
      const errorMsg =
        errorObj?.response?.data?.message ||
        errorObj?.response?.data?.errors?.username?.[0] ||
        errorObj?.response?.data?.errors?.phone_number?.[0] ||
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Quản lý Người dùng & Đại lý
          </h1>
          <p className="hidden sm:block mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Quản lý tài khoản quản trị viên, đại lý phân phối và tra cứu mật khẩu phục vụ hỗ trợ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-brand-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-brand-600 transition shadow-sm"
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

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
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
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-400">
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
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openResetModal(u)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-400 dark:hover:text-brand-400 transition shadow-2xs"
                      title="Đổi mật khẩu cho tài khoản này"
                    >
                      🔑 Đổi MK
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View cho Người Dùng */}
      <div className="block md:hidden space-y-2.5">
        {filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-900">
            Không tìm thấy tài khoản nào phù hợp.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={`mob-user-${u.id}`}
              className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5 dark:border-gray-800">
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>👤</span> {u.username}
                  </div>
                  {u.fullname && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                      {u.fullname}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {u.is_admin ? (
                    <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      Admin
                    </span>
                  ) : (
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                      Đại lý
                    </span>
                  )}
                  {u.is_locked ? (
                    <span className="rounded-md bg-error-50 px-2 py-0.5 text-xs font-bold text-error-700 dark:bg-error-950/40 dark:text-error-300">
                      Khóa
                    </span>
                  ) : (
                    <span className="rounded-md bg-success-50 px-2 py-0.5 text-xs font-bold text-success-700 dark:bg-success-950/40 dark:text-success-300">
                      Hoạt động
                    </span>
                  )}
                </div>
              </div>

              <div className="py-2.5 space-y-1.5 text-xs">
                {u.phone_number && (
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                    <span>Số điện thoại:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{u.phone_number}</span>
                  </div>
                )}
                {u.mail && (
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                    <span>Email:</span>
                    <span className="text-gray-700 dark:text-gray-300">{u.mail}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Mật khẩu:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {showPasswords[u.id] ? u.raw_password : "••••••••"}
                    </span>
                    {u.raw_password && (
                      <button
                        type="button"
                        onClick={() => toggleShowPassword(u.id)}
                        className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition"
                      >
                        {showPasswords[u.id] ? "Ẩn" : "👁 Hiện"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => openResetModal(u)}
                  className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:border-brand-500 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 transition"
                >
                  🔑 Đổi mật khẩu
                </button>
              </div>
            </div>
          ))
        )}
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

      {/* Modal Đổi Mật Khẩu */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleResetPassword}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🔑</span> Đổi Mật Khẩu
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tài khoản: <b className="text-brand-600 dark:text-brand-400">{resetUser.username}</b>
                  {resetUser.fullname ? ` (${resetUser.fullname})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {resetError && (
              <div className="rounded-xl bg-error-50 p-3 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-400 font-medium">
                {resetError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Mật khẩu mới <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showNewPassword ? "Ẩn" : "👁"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Xác nhận mật khẩu mới <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pr-10 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? "Ẩn" : "👁"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={closeResetModal}
                disabled={resetting}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition shadow disabled:opacity-50"
              >
                {resetting ? "Đang lưu..." : "Lưu mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

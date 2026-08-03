"use client";

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useSupportEditorStore } from "@/stores/use-support-editor-store";
import { useEffect, useMemo, useState } from "react";
import { FiUserPlus, FiUsers } from "react-icons/fi";

export default function SupportEditorsSection() {
  const editors = useSupportEditorStore((s) => s.editors);
  const candidates = useSupportEditorStore((s) => s.candidates);
  const roleCatalog = useSupportEditorStore((s) => s.roleCatalog);
  const candidateSearch = useSupportEditorStore((s) => s.candidateSearch);
  const roleFilter = useSupportEditorStore((s) => s.roleFilter);
  const onlyNotEditor = useSupportEditorStore((s) => s.onlyNotEditor);
  const loading = useSupportEditorStore((s) => s.loading);
  const candidatesLoading = useSupportEditorStore((s) => s.candidatesLoading);
  const saving = useSupportEditorStore((s) => s.saving);

  const fetchEditors = useSupportEditorStore((s) => s.fetchEditors);
  const fetchCandidates = useSupportEditorStore((s) => s.fetchCandidates);
  const setCandidateSearch = useSupportEditorStore((s) => s.setCandidateSearch);
  const setRoleFilter = useSupportEditorStore((s) => s.setRoleFilter);
  const setOnlyNotEditor = useSupportEditorStore((s) => s.setOnlyNotEditor);
  const grant = useSupportEditorStore((s) => s.grant);
  const revoke = useSupportEditorStore((s) => s.revoke);

  const [searchInput, setSearchInput] = useState(candidateSearch);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    void fetchEditors();
    void fetchCandidates();
  }, [fetchEditors, fetchCandidates]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setCandidateSearch(searchInput);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, setCandidateSearch]);

  useEffect(() => {
    void fetchCandidates();
  }, [candidateSearch, roleFilter, onlyNotEditor, fetchCandidates]);

  const editorIdSet = useMemo(
    () => new Set(editors.map((e) => e.user_id)),
    [editors],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGrantOne = async (userId: number, label: string) => {
    try {
      await grant(userId);
      setSelectedIds((prev) => prev.filter((x) => x !== userId));
      toast.success(`Đã gán editor: ${label}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleGrantSelected = async () => {
    const ids = selectedIds.filter((id) => !editorIdSet.has(id));
    if (!ids.length) {
      toast.error("Chọn ít nhất một user chưa là editor.");
      return;
    }
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await grant(id);
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setSelectedIds([]);
    if (ok) toast.success(`Đã gán ${ok} editor.`);
    if (fail) toast.error(`${fail} user gán thất bại.`);
  };

  const handleRevoke = async (uid: number, name?: string | null) => {
    const ok = await confirm({
      title: "Thu hồi editor",
      message: `Thu hồi quyền FAQ của ${name || `user #${uid}`}?`,
      confirmText: "Thu hồi",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await revoke(uid);
      toast.success("Đã thu hồi.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div>
        <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <FiUsers size={16} />
          Editors
        </h4>
      </div>

      {/* Role chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Role:</span>
        <button
          type="button"
          onClick={() => setRoleFilter("")}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            !roleFilter
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
          }`}
        >
          Tất cả
        </button>
        {roleCatalog.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRoleFilter(r.key)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              roleFilter === r.key
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            }`}
            title={r.key}
          >
            {r.label}
          </button>
        ))}
        {roleCatalog.length === 0 && !candidatesLoading ? (
          <span className="text-xs text-gray-400">
            (chưa load catalog role — thử tải lại)
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Tìm username / họ tên…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={onlyNotEditor}
            onChange={(e) => setOnlyNotEditor(e.target.checked)}
            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          Chỉ user chưa gán editor
        </label>
        <Button
          size="sm"
          onClick={() => void handleGrantSelected()}
          disabled={saving || selectedIds.length === 0}
        >
          <FiUserPlus className="mr-1" size={14} />
          Gán đã chọn ({selectedIds.length})
        </Button>
      </div>

      {/* Candidates table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="max-h-72 overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="w-10 px-3 py-2" />
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {candidatesLoading && candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Đang tải danh sách…
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Không có user phù hợp role / bộ lọc.
                  </td>
                </tr>
              ) : (
                candidates.map((u) => {
                  const isEd = Boolean(u.is_editor) || editorIdSet.has(u.id);
                  const checked = selectedIds.includes(u.id);
                  const label = u.fullname
                    ? `${u.username} (${u.fullname})`
                    : u.username;
                  return (
                    <tr
                      key={u.id}
                      className="bg-white hover:bg-gray-50/80 dark:bg-transparent dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          disabled={isEd || saving}
                          checked={checked && !isEd}
                          onChange={() => toggleSelect(u.id)}
                          className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-40"
                          aria-label={`Chọn ${u.username}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900 dark:text-white/90">
                          {u.username}
                        </p>
                        {u.fullname ? (
                          <p className="text-xs text-gray-500">{u.fullname}</p>
                        ) : null}
                        <p className="text-[11px] text-gray-400">#{u.id}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || []).map((r) => (
                            <Badge
                              key={r.key}
                              size="sm"
                              color="info"
                              variant="light"
                            >
                              {r.label}
                            </Badge>
                          ))}
                          {!u.roles?.length ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {u.always_can_manage ? (
                            <Badge size="sm" color="primary" variant="light">
                              Admin (luôn có quyền)
                            </Badge>
                          ) : null}
                          <Badge
                            size="sm"
                            color={isEd ? "success" : "light"}
                            variant="light"
                          >
                            {isEd ? "Đã là editor" : "Chưa gán"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {isEd ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() => void handleRevoke(u.id, label)}
                          >
                            Thu hồi
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={saving}
                            onClick={() => void handleGrantOne(u.id, label)}
                          >
                            Gán
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

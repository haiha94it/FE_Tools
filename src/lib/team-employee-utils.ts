import type { TeamEmployee } from "@/types/team-collaboration";

/** Mật khẩu hiển thị từ list employees — ưu tiên raw_password */
export function getTeamEmployeePassword(
  employee: Pick<TeamEmployee, "raw_password" | "password">,
): string {
  const value = employee.raw_password ?? employee.password;
  if (typeof value !== "string") return "";
  return value.trim();
}

export function isSameTeamEmployeeList(
  current: TeamEmployee[],
  next: TeamEmployee[],
): boolean {
  if (current.length !== next.length) return false;

  return current.every((employee, index) => {
    const other = next[index];
    return (
      employee.id === other.id &&
      employee.username === other.username &&
      employee.fullname === other.fullname &&
      employee.account_limit === other.account_limit &&
      employee.account_count === other.account_count &&
      getTeamEmployeePassword(employee) === getTeamEmployeePassword(other)
    );
  });
}
import type { TeamEmployee } from "@/types/team-collaboration";

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
      employee.account_count === other.account_count
    );
  });
}
export function getAlertRecipients({
  audience,
  customUserIds,
  fallbackEmail,
  members,
  owner
}: {
  audience: string;
  customUserIds: string[];
  fallbackEmail: string | null;
  members: Array<{ role: string; user: { email: string; id: string } }>;
  owner: { email: string; id: string };
}) {
  const users = [
    { email: owner.email, id: owner.id, role: "owner" },
    ...members.map((member) => ({
      email: member.user.email,
      id: member.user.id,
      role: member.role
    }))
  ];

  const recipients =
    audience === "all"
      ? users.map((user) => user.email)
      : audience === "custom"
        ? users
            .filter((user) => customUserIds.includes(user.id))
            .map((user) => user.email)
        : audience === "developer_and_above"
          ? users
              .filter(
                (user) =>
                  user.role === "owner" ||
                  user.role === "admin" ||
                  user.role === "developer"
              )
              .map((user) => user.email)
          : users
              .filter((user) => user.role === "owner" || user.role === "admin")
              .map((user) => user.email);

  if (recipients.length === 0 && fallbackEmail) {
    recipients.push(fallbackEmail);
  }

  return Array.from(new Set(recipients));
}

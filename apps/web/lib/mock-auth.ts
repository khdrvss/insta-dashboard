// Passphrase-auth mode — every authenticated request runs as this synthetic user
export const MOCK_USER = {
  id: "user_001",
  primaryEmailAddress: { emailAddress: "admin@instaintel.local" },
  firstName: "Admin",
  lastName: "",
  imageUrl: "",
  fullName: "Admin",
} as const;

export function isMockMode() {
  return true;
}

export async function getCurrentUser() {
  return MOCK_USER;
}

export async function getAuth() {
  return { userId: MOCK_USER.id };
}

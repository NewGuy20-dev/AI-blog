export const ADMIN_USER_IDS = [
  "google-oauth2|101765812180352599429",
  
];

export const isAdmin = (userId: string | undefined | null): boolean => {
  return !!userId && ADMIN_USER_IDS.includes(userId);
};

/** Roles stored on the Admin row. Only OWNER exists today. */
export type AdminRole = "OWNER" | "MANAGER" | "TECH";

/** Safe admin fields returned by /api/auth/* — never includes the hash. */
export type AdminDTO = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mustChangePassword: boolean;
};

/** Body sent to POST /api/auth/login */
export type LoginPayload = {
  email: string;
  password: string;
};

/** Body sent to POST /api/auth/change-password */
export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

/** Values managed by react-hook-form on the login page. */
export type LoginFormValues = {
  email: string;
  password: string;
};

/** Values managed by react-hook-form on the change-password panel. */
export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

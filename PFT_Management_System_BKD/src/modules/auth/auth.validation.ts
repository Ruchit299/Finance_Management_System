import messages from "../../helper/constants/messages.ts";

// Shared email validator
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 50 && emailRegex.test(email);
};

// Generic types for validation result
interface ValidationErrorDetail {
  message: string;
}

interface ValidationError {
  details: ValidationErrorDetail[];
}

interface ValidationResult<T> {
  error: ValidationError | null;
  validatedData?: T;
}

// Define expected payload shapes
interface RegisterData {
  name?: string;
  email: string;
  contact?: string | null;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ChangePasswordData {
  email: string;
  newPassword: string;
}

interface FirstChangePasswordData {
  newPassword: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  email: string;
  newPassword: string;
}

// REGISTER VALIDATION
const validateRegister = (data: RegisterData): ValidationResult<RegisterData> => {
  const errors: ValidationErrorDetail[] = [];

  // if (!data.name || typeof data.name !== "string" || data.name.length < 3 || data.name.length > 50) {
  //   errors.push({ message: messages.VALIDATION.NAME_INVALID });
  // }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_INVALID });
  }

  // if (
  //   data.contact !== undefined &&
  //   data.contact !== null &&
  //   (typeof data.contact !== "string" || data.contact.length < 9 || data.contact.length > 12)
  // ) {
  //   errors.push({ message: messages.VALIDATION.CONTACT_INVALID });
  // }

  if (!data.password || typeof data.password !== "string" || data.password.length < 6) {
    errors.push({ message: messages.VALIDATION.PASSWORD_INVALID });
  }

  return errors.length > 0 ? { error: { details: errors } } : { error: null, validatedData: data };
};

// LOGIN VALIDATION
const validateLogin = (data: LoginData): ValidationResult<LoginData> => {
  const errors: ValidationErrorDetail[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_INVALID });
  }

  if (!data.password || typeof data.password !== "string" || data.password.length < 6) {
    errors.push({ message: messages.VALIDATION.PASSWORD_INVALID });
  }

  return errors.length > 0 ? { error: { details: errors } } : { error: null, validatedData: data };
};

// CHANGE PASSWORD VALIDATION
const validateChangePassword = (data: ChangePasswordData): ValidationResult<ChangePasswordData> => {
  const errors: ValidationErrorDetail[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_INVALID });
  }

  if (!data.newPassword || typeof data.newPassword !== "string" || data.newPassword.length < 6) {
    errors.push({ message: messages.VALIDATION.NEWPASSWORD_INVALID });
  }

  return errors.length > 0 ? { error: { details: errors } } : { error: null, validatedData: data };
};

// FIRST CHANGE PASSWORD VALIDATION
const validateFirstChangePassword = (
  data: FirstChangePasswordData
): ValidationResult<FirstChangePasswordData> => {
  const errors: ValidationErrorDetail[] = [];

  if (!data.newPassword || typeof data.newPassword !== "string" || data.newPassword.length < 6) {
    errors.push({ message: messages.VALIDATION.NEWPASSWORD_INVALID });
  }

  return errors.length > 0 ? { error: { details: errors } } : { error: null, validatedData: data };
};

// FORGOT PASSWORD VALIDATION
const validateForgotPassword = (data: ForgotPasswordData): ValidationResult<ForgotPasswordData> => {
  const errors: ValidationErrorDetail[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_INVALID });
  }

  return errors.length > 0 ? { error: { details: errors } } : { error: null, validatedData: data };
};

// RESET PASSWORD VALIDATION
const validateResetPassword = (data: ResetPasswordData): ValidationResult<ResetPasswordData> => {
  const errors: ValidationErrorDetail[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_INVALID });
  }

  if (!data.newPassword || typeof data.newPassword !== "string" || data.newPassword.length < 6) {
    errors.push({ message: messages.VALIDATION.NEWPASSWORD_INVALID });
  }

  return errors.length > 0 ? { error: { details: errors } } : { error: null, validatedData: data };
};

export {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateFirstChangePassword,
  validateForgotPassword,
  validateResetPassword,
};

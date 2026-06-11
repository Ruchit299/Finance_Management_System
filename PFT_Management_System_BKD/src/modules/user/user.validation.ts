import messages from "../../helper/constants/messages.ts";

interface UserData {
  name: string;
  email: string;
  contact?: string | null;
  password: string;
  status?: number;
}

interface UserUpdateData {
  name: string;
  email: string;
  contact?: string | null;
  password?: string;
  status?: number;
}

interface UserPatchData {
  name?: string;
  email?: string;
  contact?: string | null;
  password?: string;
  status?: number;
}

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && email.length <= 50 && emailRegex.test(email);
};

const validateUser = (data: UserData): ValidationResult<UserData> => {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== "string" || data.name.length < 3 || data.name.length > 50) {
    errors.push({ message: messages.VALIDATION.NAME_REQUIRED });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_REQUIRED });
  }

  if (
    data.contact !== undefined &&
    data.contact !== null &&
    (typeof data.contact !== "string" || data.contact.length < 10 || data.contact.length > 12)
  ) {
    errors.push({ message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID });
  }

  if (!data.password || typeof data.password !== "string" || data.password.length < 6) {
    errors.push({ message: messages.VALIDATION.PASSWORD_REQUIRED });
  }

  return errors.length > 0
    ? { error: { details: errors } }
    : { error: null, validatedData: data };
};

const validateUserUpdate = (data: UserUpdateData): ValidationResult<UserUpdateData> => {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== "string" || data.name.length < 3 || data.name.length > 50) {
    errors.push({ message: messages.VALIDATION.NAME_REQUIRED });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_REQUIRED });
  }

  if (
    data.contact !== undefined &&
    data.contact !== null &&
    (typeof data.contact !== "string" || data.contact.length < 10 || data.contact.length > 12)
  ) {
    errors.push({ message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID });
  }

  if (data.password !== undefined && (typeof data.password !== "string" || data.password.length < 6)) {
    errors.push({ message: messages.VALIDATION.PASSWORD_REQUIRED });
  }

  return errors.length > 0
    ? { error: { details: errors } }
    : { error: null, validatedData: data };
};

const validateUserPatch = (data: UserPatchData): ValidationResult<UserPatchData> => {
  const errors: ValidationError[] = [];

  // if (!data.name && !data.email && data.contact === undefined && !data.password && data.status) {
  //   errors.push({ message: messages.VALIDATION.USER_PATCH_FIELDS_REQUIRED });
  // }
  if (data.name === undefined && data.email === undefined && data.contact === undefined && data.password === undefined && data.status === undefined) {
    errors.push({ message: messages.VALIDATION.USER_PATCH_FIELDS_REQUIRED });
  }

  if (
    data.name !== undefined &&
    (typeof data.name !== "string" || data.name.length < 3 || data.name.length > 50)
  ) {
    errors.push({ message: messages.VALIDATION.NAME_OPTIONAL_INVALID });
  }

  if (data.email !== undefined && !validateEmail(data.email)) {
    errors.push({ message: messages.VALIDATION.EMAIL_INVALID });
  }

  if (
    data.contact !== undefined &&
    data.contact !== null &&
    (typeof data.contact !== "string" || data.contact.length < 10 || data.contact.length > 12)
  ) {
    errors.push({ message: messages.VALIDATION.CONTACT_INVALID });
  }

  if (data.status !== undefined && (data.status !== 0 && data.status !== 1)) {
    errors.push({ message: messages.VALIDATION.STATUS_INVALID });
  }


  if (data.password !== undefined && (typeof data.password !== "string" || data.password.length < 6)) {
    errors.push({ message: messages.VALIDATION.PASSWORD_INVALID });
  }

  return errors.length > 0
    ? { error: { details: errors } }
    : { error: null, validatedData: data };
};

export { validateUser, validateUserUpdate, validateUserPatch };

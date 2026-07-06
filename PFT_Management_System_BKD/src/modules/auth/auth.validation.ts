import { IsEmail, IsString, MinLength, MaxLength, IsOptional, validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";
import messages from "../../helper/constants/messages.ts";

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

class RegisterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail({}, { message: messages.VALIDATION.EMAIL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_INVALID })
  email!: string;

  @IsOptional()
  contact?: string | null;

  @IsString({ message: messages.VALIDATION.PASSWORD_INVALID })
  @MinLength(6, { message: messages.VALIDATION.PASSWORD_INVALID })
  password!: string;
}

class LoginDto {
  @IsEmail({}, { message: messages.VALIDATION.EMAIL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_INVALID })
  email!: string;

  @IsString({ message: messages.VALIDATION.PASSWORD_INVALID })
  @MinLength(6, { message: messages.VALIDATION.PASSWORD_INVALID })
  password!: string;
}

class ChangePasswordDto {
  @IsEmail({}, { message: messages.VALIDATION.EMAIL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_INVALID })
  email!: string;

  @IsString({ message: messages.VALIDATION.NEWPASSWORD_INVALID })
  @MinLength(6, { message: messages.VALIDATION.NEWPASSWORD_INVALID })
  newPassword!: string;
}

class FirstChangePasswordDto {
  @IsString({ message: messages.VALIDATION.NEWPASSWORD_INVALID })
  @MinLength(6, { message: messages.VALIDATION.NEWPASSWORD_INVALID })
  newPassword!: string;
}

class ForgotPasswordDto {
  @IsEmail({}, { message: messages.VALIDATION.EMAIL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_INVALID })
  email!: string;
}

class ResetPasswordDto {
  @IsEmail({}, { message: messages.VALIDATION.EMAIL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_INVALID })
  email!: string;

  @IsString({ message: messages.VALIDATION.NEWPASSWORD_INVALID })
  @MinLength(6, { message: messages.VALIDATION.NEWPASSWORD_INVALID })
  newPassword!: string;
}

function validateDto<T extends object>(cls: new () => T, data: any): ValidationResult<T> {
  const instance = plainToInstance(cls, data);
  const errors = validateSync(instance, { skipMissingProperties: false, whitelist: true });
  if (errors.length > 0) {
    const details = errors.map((err) => {
      const constraints = err.constraints ? Object.values(err.constraints) : [];
      return { message: constraints[0] || "Validation failed" };
    });
    return { error: { details } };
  }
  return { error: null, validatedData: instance };
}

const validateRegister = (data: any) => validateDto(RegisterDto, data);
const validateLogin = (data: any) => validateDto(LoginDto, data);
const validateChangePassword = (data: any) => validateDto(ChangePasswordDto, data);
const validateFirstChangePassword = (data: any) => validateDto(FirstChangePasswordDto, data);
const validateForgotPassword = (data: any) => validateDto(ForgotPasswordDto, data);
const validateResetPassword = (data: any) => validateDto(ResetPasswordDto, data);

export {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateFirstChangePassword,
  validateForgotPassword,
  validateResetPassword,
};

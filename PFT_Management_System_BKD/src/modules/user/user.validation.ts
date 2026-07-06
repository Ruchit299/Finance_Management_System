import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn, validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";
import messages from "../../helper/constants/messages.ts";

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

class UserDto {
  @IsString({ message: messages.VALIDATION.NAME_REQUIRED })
  @MinLength(3, { message: messages.VALIDATION.NAME_REQUIRED })
  @MaxLength(50, { message: messages.VALIDATION.NAME_REQUIRED })
  name!: string;

  @IsEmail({}, { message: messages.VALIDATION.EMAIL_REQUIRED })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_REQUIRED })
  email!: string;

  @IsOptional()
  @IsString({ message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID })
  @MinLength(10, { message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID })
  @MaxLength(12, { message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID })
  contact?: string | null;

  @IsString({ message: messages.VALIDATION.PASSWORD_REQUIRED })
  @MinLength(6, { message: messages.VALIDATION.PASSWORD_REQUIRED })
  password!: string;

  @IsOptional()
  status?: number;
}

class UserUpdateDto {
  @IsString({ message: messages.VALIDATION.NAME_REQUIRED })
  @MinLength(3, { message: messages.VALIDATION.NAME_REQUIRED })
  @MaxLength(50, { message: messages.VALIDATION.NAME_REQUIRED })
  name!: string;

  @IsEmail({}, { message: messages.VALIDATION.EMAIL_REQUIRED })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_REQUIRED })
  email!: string;

  @IsOptional()
  @IsString({ message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID })
  @MinLength(10, { message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID })
  @MaxLength(12, { message: messages.VALIDATION.CONTACT_OPTIONAL_INVALID })
  contact?: string | null;

  @IsOptional()
  @IsString({ message: messages.VALIDATION.PASSWORD_REQUIRED })
  @MinLength(6, { message: messages.VALIDATION.PASSWORD_REQUIRED })
  password?: string;

  @IsOptional()
  status?: number;
}

class UserPatchDto {
  @IsOptional()
  @IsString({ message: messages.VALIDATION.NAME_OPTIONAL_INVALID })
  @MinLength(3, { message: messages.VALIDATION.NAME_OPTIONAL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.NAME_OPTIONAL_INVALID })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: messages.VALIDATION.EMAIL_INVALID })
  @MaxLength(50, { message: messages.VALIDATION.EMAIL_INVALID })
  email?: string;

  @IsOptional()
  @IsString({ message: messages.VALIDATION.CONTACT_INVALID })
  @MinLength(10, { message: messages.VALIDATION.CONTACT_INVALID })
  @MaxLength(12, { message: messages.VALIDATION.CONTACT_INVALID })
  contact?: string | null;

  @IsOptional()
  @IsString({ message: messages.VALIDATION.PASSWORD_INVALID })
  @MinLength(6, { message: messages.VALIDATION.PASSWORD_INVALID })
  password?: string;

  @IsOptional()
  @IsIn([0, 1], { message: messages.VALIDATION.STATUS_INVALID })
  status?: number;
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

const validateUser = (data: any) => validateDto(UserDto, data);
const validateUserUpdate = (data: any) => validateDto(UserUpdateDto, data);

const validateUserPatch = (data: any): ValidationResult<UserPatchDto> => {
  if (
    data.name === undefined &&
    data.email === undefined &&
    data.contact === undefined &&
    data.password === undefined &&
    data.status === undefined
  ) {
    return { error: { details: [{ message: messages.VALIDATION.USER_PATCH_FIELDS_REQUIRED }] } };
  }
  return validateDto(UserPatchDto, data);
};

export { validateUser, validateUserUpdate, validateUserPatch };

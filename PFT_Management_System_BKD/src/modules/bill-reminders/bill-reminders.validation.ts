import { IsString, IsOptional, IsIn, IsNumber, Min, IsDateString, MaxLength, validateSync } from "class-validator";
import { plainToInstance, Type } from "class-transformer";

interface ValidationError { message: string; }
interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

class CreateBillReminderDto {
  @IsString({ message: "Name must be a string" })
  @MaxLength(100, { message: "Name must be at most 100 characters" })
  name!: string;

  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount!: number;

  @IsDateString({}, { message: "Due date must be a valid date (YYYY-MM-DD)" })
  dueDate!: string;

  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId!: number;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;
}

class UpdateBillReminderDto {
  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @MaxLength(100, { message: "Name must be at most 100 characters" })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: "Due date must be a valid date (YYYY-MM-DD)" })
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId?: number;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;
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

const validateCreateBillReminder = (data: any) => validateDto(CreateBillReminderDto, data);
const validateUpdateBillReminder = (data: any) => validateDto(UpdateBillReminderDto, data);

export { validateCreateBillReminder, validateUpdateBillReminder };

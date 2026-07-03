import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  IsDateString,
  validateSync,
} from "class-validator";
import { plainToInstance, Type } from "class-transformer";

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

const TYPES = ["income", "expense"];
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Yearly"];

class CreateRecurringTransactionDto {
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount!: number;

  @IsIn(TYPES, { message: "Type must be income or expense" })
  type!: "income" | "expense";

  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId!: number;

  @IsIn(FREQUENCIES, { message: "Frequency must be Daily, Weekly, Monthly or Yearly" })
  frequency!: "Daily" | "Weekly" | "Monthly" | "Yearly";

  @IsDateString({}, { message: "Start date must be a valid date (YYYY-MM-DD)" })
  startDate!: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;

  @IsOptional()
  @IsIn(["Cash", "UPI", "Online"], { message: "Payment method must be Cash, UPI or Online" })
  paymentMethod?: "Cash" | "UPI" | "Online";
}

class UpdateRecurringTransactionDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId?: number;

  @IsOptional()
  @IsIn(FREQUENCIES, { message: "Frequency must be Daily, Weekly, Monthly or Yearly" })
  frequency?: "Daily" | "Weekly" | "Monthly" | "Yearly";

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid date (YYYY-MM-DD)" })
  startDate?: string;

  @IsOptional()
  @IsIn(TYPES, { message: "Type must be income or expense" })
  type?: "income" | "expense";

  @IsOptional()
  @IsIn(["Cash", "UPI", "Online"], { message: "Payment method must be Cash, UPI or Online" })
  paymentMethod?: "Cash" | "UPI" | "Online";
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

const validateCreateRecurringTransaction = (data: any) =>
  validateDto(CreateRecurringTransactionDto, data);
const validateUpdateRecurringTransaction = (data: any) =>
  validateDto(UpdateRecurringTransactionDto, data);

export { validateCreateRecurringTransaction, validateUpdateRecurringTransaction };

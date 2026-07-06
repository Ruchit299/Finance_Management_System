import { IsString, IsOptional, IsIn, IsNumber, Min, IsDateString, validateSync } from "class-validator";
import { plainToInstance, Type } from "class-transformer";

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

class CreateTransactionDto {
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount!: number;

  @IsIn(["income", "expense"], { message: "Type must be either 'income' or 'expense'" })
  type!: "income" | "expense";

  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId!: number;

  @IsDateString({}, { message: "Date must be a valid date string (YYYY-MM-DD)" })
  date!: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;

  @IsOptional()
  @IsIn(["Cash", "UPI", "Online"], { message: "Payment method must be Cash, UPI or Online" })
  paymentMethod?: "Cash" | "UPI" | "Online";

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "investmentId must be a valid number" })
  investmentId?: number;
}

class UpdateTransactionDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount?: number;

  @IsOptional()
  @IsIn(["income", "expense"], { message: "Type must be either 'income' or 'expense'" })
  type?: "income" | "expense";

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId?: number;

  @IsOptional()
  @IsDateString({}, { message: "Date must be a valid date string (YYYY-MM-DD)" })
  date?: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;

  @IsOptional()
  @IsIn(["Cash", "UPI", "Online"], { message: "Payment method must be Cash, UPI or Online" })
  paymentMethod?: "Cash" | "UPI" | "Online";

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "investmentId must be a valid number" })
  investmentId?: number;
}

class FilterTransactionDto {
  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid date string (YYYY-MM-DD)" })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: "End date must be a valid date string (YYYY-MM-DD)" })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "categoryId must be a valid number" })
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "investmentId must be a valid number" })
  investmentId?: number;

  @IsOptional()
  @IsIn(["income", "expense"], { message: "Type must be either 'income' or 'expense'" })
  type?: "income" | "expense";

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Min amount must be a number" })
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Max amount must be a number" })
  maxAmount?: number;

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

const validateCreateTransaction = (data: any) => validateDto(CreateTransactionDto, data);
const validateUpdateTransaction = (data: any) => validateDto(UpdateTransactionDto, data);
const validateFilterTransaction = (data: any) => validateDto(FilterTransactionDto, data);

export { validateCreateTransaction, validateUpdateTransaction, validateFilterTransaction };
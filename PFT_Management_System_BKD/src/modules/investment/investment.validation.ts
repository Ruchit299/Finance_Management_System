import { IsString, IsOptional, IsIn, IsNumber, Min, IsDateString, validateSync } from "class-validator";
import { plainToInstance, Type } from "class-transformer";

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

class CreateInvestmentDto {
  @IsString({ message: "Name must be a string" })
  name!: string;

  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount!: number;

  @Type(() => Number)
  @IsNumber({}, { message: "Target return must be a valid number" })
  @Min(0.01, { message: "Target return must be greater than 0" })
  targetAmount!: number;

  @Type(() => Number)
  @IsNumber({}, { message: "CategoryId must be a valid number" })
  categoryId!: number;

  @IsDateString({}, { message: "Start date must be a valid date string (YYYY-MM-DD)" })
  startDate!: string;

  @IsDateString({}, { message: "Maturity date must be a valid date string (YYYY-MM-DD)" })
  maturityDate!: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;

  @IsOptional()
  @IsIn(["Active", "Matured", "Completed"], { message: "Status must be Active, Matured, or Completed" })
  status?: "Active" | "Matured" | "Completed";

  @IsOptional()
  @IsIn(["Cash", "UPI", "Online"], { message: "Payment method must be Cash, UPI, or Online" })
  paymentMethod?: "Cash" | "UPI" | "Online";
}

class UpdateInvestmentDto {
  @IsOptional()
  @IsString({ message: "Name must be a string" })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Target return must be a valid number" })
  @Min(0.01, { message: "Target return must be greater than 0" })
  targetAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "CategoryId must be a valid number" })
  categoryId?: number;

  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid date string (YYYY-MM-DD)" })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: "Maturity date must be a valid date string (YYYY-MM-DD)" })
  maturityDate?: string;

  @IsOptional()
  @IsString({ message: "Notes must be a string" })
  notes?: string;

  @IsOptional()
  @IsIn(["Active", "Matured", "Completed"], { message: "Status must be Active, Matured, or Completed" })
  status?: "Active" | "Matured" | "Completed";

  @IsOptional()
  @IsIn(["Cash", "UPI", "Online"], { message: "Payment method must be Cash, UPI, or Online" })
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

const validateCreateInvestment = (data: any) => validateDto(CreateInvestmentDto, data);
const validateUpdateInvestment = (data: any) => validateDto(UpdateInvestmentDto, data);

export { validateCreateInvestment, validateUpdateInvestment };

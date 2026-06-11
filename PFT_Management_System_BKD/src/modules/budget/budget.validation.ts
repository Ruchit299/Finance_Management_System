import { IsString, IsOptional, IsIn, IsNumber, Min, Matches, validateSync } from "class-validator";
import { plainToInstance, Type } from "class-transformer";

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

class CreateBudgetDto {
  @IsIn(["Food", "Transport", "Rent", "Shopping", "Entertainment", "Salary", "Investment"], {
    message: "Invalid category choice",
  })
  category!: "Food" | "Transport" | "Rent" | "Shopping" | "Entertainment" | "Salary" | "Investment";

  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount!: number;

  @IsString({ message: "Month must be a string" })
  @Matches(/^\d{4}-\d{2}$/, { message: "Month must be in YYYY-MM format" })
  month!: string;
}

class UpdateBudgetDto {
  @Type(() => Number)
  @IsNumber({}, { message: "Amount must be a valid number" })
  @Min(0.01, { message: "Amount must be greater than 0" })
  amount!: number;
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

const validateCreateBudget = (data: any) => validateDto(CreateBudgetDto, data);
const validateUpdateBudget = (data: any) => validateDto(UpdateBudgetDto, data);

export { validateCreateBudget, validateUpdateBudget };

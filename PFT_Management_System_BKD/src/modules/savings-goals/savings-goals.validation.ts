import { IsString, IsOptional, IsNumber, Min, IsDateString, MaxLength, validateSync } from "class-validator";
import { plainToInstance, Type } from "class-transformer";

interface ValidationError {
  message: string;
}

interface ValidationResult<T> {
  error: { details: ValidationError[] } | null;
  validatedData?: T;
}

class CreateSavingsGoalDto {
  @IsString({ message: "Name must be a string" })
  @MaxLength(100, { message: "Name must be at most 100 characters" })
  name!: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: "Target amount must be a valid number" })
  @Min(0.01, { message: "Target amount must be greater than 0" })
  targetAmount!: number;

  @IsDateString({}, { message: "Target date must be a valid date (YYYY-MM-DD)" })
  targetDate!: string;
}

class UpdateSavingsGoalDto {
  @IsOptional()
  @IsString({ message: "Name must be a string" })
  @MaxLength(100, { message: "Name must be at most 100 characters" })
  name?: string;

  @IsOptional()
  @IsString({ message: "Description must be a string" })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Target amount must be a valid number" })
  @Min(0.01, { message: "Target amount must be greater than 0" })
  targetAmount?: number;

  @IsOptional()
  @IsDateString({}, { message: "Target date must be a valid date (YYYY-MM-DD)" })
  targetDate?: string;
}

class AddSavingsDto {
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

const validateCreateSavingsGoal = (data: any) => validateDto(CreateSavingsGoalDto, data);
const validateUpdateSavingsGoal = (data: any) => validateDto(UpdateSavingsGoalDto, data);
const validateAddSavings = (data: any) => validateDto(AddSavingsDto, data);

export { validateCreateSavingsGoal, validateUpdateSavingsGoal, validateAddSavings };

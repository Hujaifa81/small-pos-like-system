import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type PasswordPolicy = {
  minLength?: number;
  minLowercase?: number;
  minUppercase?: number;
  minNumbers?: number;
  minSymbols?: number;
};

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments) {
    const policy: PasswordPolicy =
      (args?.constraints && args.constraints[0]) || {};
    const minLen = policy.minLength ?? 8;
    const minLower = policy.minLowercase ?? 1;
    const minUpper = policy.minUppercase ?? 1;
    const minNums = policy.minNumbers ?? 1;
    const minSymbols = policy.minSymbols ?? 1;

    if (typeof value !== 'string') return false;
    if (value.length < minLen) return false;
    if (minLower > 0 && (value.match(/[a-z]/g) || []).length < minLower)
      return false;
    if (minUpper > 0 && (value.match(/[A-Z]/g) || []).length < minUpper)
      return false;
    if (minNums > 0 && (value.match(/\d/g) || []).length < minNums)
      return false;
    if (minSymbols > 0 && (value.match(/[\W_]/g) || []).length < minSymbols)
      return false;

    return true;
  }

  defaultMessage(args?: ValidationArguments) {
    const policy: PasswordPolicy =
      (args?.constraints && args.constraints[0]) || {};
    const minLen = policy.minLength ?? 8;
    return `Password must be at least ${minLen} chars and include uppercase, lowercase, number and special character`;
  }
}

export function IsStrongPassword(
  policy: PasswordPolicy = {},
  validationOptions?: ValidationOptions,
) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      target: (target as any).constructor,
      propertyName,
      options: validationOptions,
      constraints: [policy],
      validator: IsStrongPasswordConstraint,
    });
  };
}

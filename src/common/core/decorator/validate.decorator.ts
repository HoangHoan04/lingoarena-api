import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber as libIsNumber,
  IsPhoneNumber as libIsPhoneNumber,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { CountryCode } from 'libphonenumber-js';

export interface IValidationOptions extends ValidationOptions {
  required?: boolean;
}

export function IsPhoneNumber(
  region: CountryCode,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    Type(() => String)(target, propertyKey);
    libIsPhoneNumber(region, validationOptions)(target, propertyKey);
  };
}

export function IsNumber(validationOptions?: IValidationOptions): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    let required = false;
    if (validationOptions && validationOptions.required) {
      required = validationOptions.required;
    }
    if (!required) {
      IsOptional({
        each: true,
      })(target, propertyKey);
    }
    Type(() => Number)(target, propertyKey);
    libIsNumber({ allowNaN: false }, validationOptions)(target, propertyKey);
  };
}

export function IsLongerThan(property: string, validationOptions: ValidationOptions = {}) {
  return function (object: Object, propertyName: string) {
    if (!validationOptions.message) {
      Object.assign(validationOptions, {
        message: `${propertyName} must be longer than `,
      });
    }
    registerDecorator({
      name: 'isLongerThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return (
            typeof value === 'string' &&
            typeof relatedValue === 'string' &&
            value.length > relatedValue.length
          );
        },
      },
    });
  };
}

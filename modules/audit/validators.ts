import { z } from 'zod';
import type { AuditQuestion } from './types';

const multipleChoiceValidator = (options: string[]) =>
  z.string().refine(
    (value) => options.includes(value),
    { message: "Please select a valid option." }
  );

const numberValidator = (min?: number, max?: number, step?: number) => {
  let schema = z.number({ invalid_type_error: "Please enter a valid number." });
  
  if (min !== undefined) {
    schema = schema.min(min, `Value must be at least ${min}.`);
  }
  
  if (max !== undefined) {
    schema = schema.max(max, `Value must be no more than ${max}.`);
  }
  
  if (step === 1) {
    schema = schema.int("Please enter a whole number.");
  }
  
  return schema;
};

const currencyValidator = (max?: number) => {
  let schema = z.number({ invalid_type_error: "Please enter a valid amount." })
    .min(0, "Amount must be positive.")
    .multipleOf(0.01, "Please enter up to 2 decimal places.");
  
  if (max !== undefined) {
    schema = schema.max(max, `Amount must be no more than $${max.toLocaleString()}.`);
  }
  
  return schema;
};

const textValidator = () =>
  z.string()
    .trim()
    .min(2, "Please enter at least 2 characters.");

export function validateQuestion(question: AuditQuestion, value: unknown): { valid: boolean; error?: string } {
  try {
    let schema: z.ZodSchema;
    
    switch (question.type) {
      case 'multiple-choice':
        if (!question.options) {
          return { valid: false, error: "Invalid question configuration." };
        }
        schema = multipleChoiceValidator(question.options.map(opt => opt.value));
        break;
        
      case 'number':
        const { min, max, step } = question;
        schema = numberValidator(min, max, step);
        break;
        
      case 'currency':
        const currencyMax = question.max;
        schema = currencyValidator(currencyMax);
        break;
        
      case 'text':
        schema = textValidator();
        break;
        
      default:
        return { valid: false, error: "Unknown question type." };
    }
    
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || "Invalid input." };
    }
    return { valid: false, error: "Validation error." };
  }
}
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { validateQuestion } from './validators';
import type { Question } from './types';

interface QuestionRendererProps {
  question: Question;
  value: unknown;
  onValueChange: (value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function QuestionRenderer({ 
  question, 
  value, 
  onValueChange, 
  onNext, 
  onBack, 
  canGoBack 
}: QuestionRendererProps) {
  const [validationError, setValidationError] = useState<string>();
  const [isValid, setIsValid] = useState(false);

  // Validate whenever value changes
  useEffect(() => {
    if (value === undefined || value === null || value === '') {
      setIsValid(false);
      setValidationError(undefined);
      return;
    }

    const validation = validateQuestion(question, value);
    setIsValid(validation.valid);
    setValidationError(validation.error);
  }, [question, value]);

  const handleNext = () => {
    if (isValid) {
      onNext();
    }
  };

  const renderInput = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={value as string || ''}
            onValueChange={onValueChange}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => onValueChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="Enter a number"
            min={question.validation?.min}
            max={question.validation?.max}
            step={question.validation?.step}
            className="max-w-xs"
          />
        );

      case 'currency':
        return (
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={value as number || ''}
              onChange={(e) => onValueChange(e.target.value ? Number(e.target.value) : '')}
              placeholder="0.00"
              min={question.validation?.min || 0}
              max={question.validation?.max}
              step="0.01"
              className="pl-8"
            />
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[100px] resize-none"
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">
          {question.label}
        </h3>
        {question.description && (
          <p className="text-sm text-muted-foreground">
            {question.description}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="space-y-2">
        {renderInput()}
        {validationError && (
          <p className="text-sm text-destructive">
            {validationError}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className={!canGoBack ? 'invisible' : ''}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="bg-brand-gradient hover:opacity-90 text-white"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
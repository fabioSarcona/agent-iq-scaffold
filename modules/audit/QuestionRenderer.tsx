import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { validateQuestion } from './validators';
import type { AuditQuestion } from './types';

interface QuestionRendererProps {
  question: AuditQuestion;
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
      case 'multiple-choice':
        return (
          <RadioGroup
            value={value as string || ''}
            onValueChange={onValueChange}
            className="space-y-4"
          >
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg glass-card hover-lift transition-all duration-300">
                <RadioGroupItem value={option.value} id={option.value} className="min-w-[20px] min-h-[20px]" />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-medium text-sm md:text-base leading-relaxed">
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
            placeholder={question.placeholder || "Enter a number"}
            min={question.min}
            max={question.max}
            step={question.step}
            className="max-w-sm"
          />
        );

      case 'currency':
        return (
          <div className="relative max-w-sm">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
              $
            </span>
            <Input
              type="number"
              value={value as number || ''}
              onChange={(e) => onValueChange(e.target.value ? Number(e.target.value) : '')}
              placeholder={question.placeholder || "0.00"}
              min={question.min || 0}
              max={question.max}
              step="0.01"
              className="pl-10"
            />
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={question.placeholder || "Type your answer here..."}
            className="min-h-[120px] resize-none"
          />
        );

      default:
        return <div className="text-muted-foreground">Unsupported question type</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8 animate-fade-in-scale">
        {/* Question Header */}
        <div className="space-y-3">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
            {question.label}
          </h3>
          {question.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {question.description}
            </p>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          {renderInput()}
          {validationError && (
            <div className="flex items-start space-x-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {validationError}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={!canGoBack}
            size="lg"
            className={!canGoBack ? 'invisible' : 'flex-1 sm:flex-none min-w-[120px]'}
          >
            ← Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!isValid}
            size="lg"
            className="flex-1 sm:flex-none min-w-[120px] font-semibold"
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
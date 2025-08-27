import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

interface FAQAccordionProps {
  items: Array<{ q: string; a: string }>
  className?: string
}

const FAQAccordion = React.forwardRef<HTMLDivElement, FAQAccordionProps>(
  ({ items, className }, ref) => {
    return (
      <div ref={ref} className={cn("", className)}>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }
)

FAQAccordion.displayName = "FAQAccordion"

export { FAQAccordion }
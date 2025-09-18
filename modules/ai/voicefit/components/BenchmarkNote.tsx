import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

interface BenchmarkNoteProps {
  notes: string[]
  className?: string
}

const BenchmarkNote = React.forwardRef<HTMLDivElement, BenchmarkNoteProps>(
  ({ notes, className }, ref) => {
    // Hide if no notes or only contains generic placeholder text
    if (notes.length === 0 || 
        (notes.length === 1 && (
          notes[0] === 'AI Analysis Complete' || 
          notes[0]?.trim() === ''
        ))) {
      return null
    }

    return (
      <Card ref={ref} className={cn("border-muted bg-muted/20", className)}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              {notes.map((note, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  {note}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)

BenchmarkNote.displayName = "BenchmarkNote"

export { BenchmarkNote }
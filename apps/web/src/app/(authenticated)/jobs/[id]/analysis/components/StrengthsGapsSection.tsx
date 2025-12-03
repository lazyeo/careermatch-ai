import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@careermatch/ui'

interface StrengthsGapsSectionProps {
  strengths: string[]
  gaps: string[]
}

export function StrengthsGapsSection({ strengths, gaps }: StrengthsGapsSectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Strengths */}
      <Card className="border-success-200 bg-success-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success-700">
            <CheckCircle2 className="w-5 h-5" />
            主要优势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Gaps */}
      <Card className="border-warning-200 bg-warning-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning-700">
            <AlertCircle className="w-5 h-5" />
            需要改进
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {gaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{gap}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

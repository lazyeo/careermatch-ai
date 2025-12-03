import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react'
import { Card, CardContent } from '@careermatch/ui'
import type { SWOTAnalysis } from '@careermatch/shared'

interface SWOTMatrixProps {
  swot: SWOTAnalysis
}

export function SWOTMatrix({ swot }: SWOTMatrixProps) {
  const sections = [
    {
      title: 'Strengths 优势',
      icon: TrendingUp,
      items: swot.strengths,
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      iconColor: 'text-success-600',
      description: '内部积极因素',
    },
    {
      title: 'Weaknesses 劣势',
      icon: TrendingDown,
      items: swot.weaknesses,
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      iconColor: 'text-error-600',
      description: '内部限制因素',
    },
    {
      title: 'Opportunities 机会',
      icon: Target,
      items: swot.opportunities,
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      iconColor: 'text-primary-600',
      description: '外部有利因素',
    },
    {
      title: 'Threats 威胁',
      icon: Shield,
      items: swot.threats,
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-600',
      description: '外部挑战因素',
    },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {sections.map((section, index) => {
        const Icon = section.icon
        return (
          <Card key={index} className={`${section.bgColor} ${section.borderColor}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${section.iconColor}`} />
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">{section.description}</p>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

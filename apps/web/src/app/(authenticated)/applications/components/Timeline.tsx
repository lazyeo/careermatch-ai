'use client'

import { format } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'

interface TimelineEvent {
  type: string
  date: string
  description: string
  oldStatus?: string
  newStatus?: string
}

interface TimelineProps {
  events: TimelineEvent[]
}

const EVENT_ICONS: Record<string, string> = {
  created: '📝',
  submitted: '📤',
  status_changed: '🔄',
  interview: '🎤',
  offer: '🎉',
  rejected: '❌',
  withdrawn: '⏪',
  note_added: '📋',
  default: '•',
}

const EVENT_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  status_changed: 'bg-yellow-100 text-yellow-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-700',
  note_added: 'bg-blue-50 text-blue-600',
  default: 'bg-gray-100 text-gray-600',
}

export function Timeline({ events }: TimelineProps) {
  const t = useTranslations('applications')
  const locale = useLocale()
  const dateLocale = locale === 'zh-CN' ? zhCN : enUS

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t('noTimelineEvents')}</p>
      </div>
    )
  }

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedEvents.map((event, eventIdx) => {
          const icon = EVENT_ICONS[event.type] || EVENT_ICONS.default
          const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.default
          const newStatus = event.newStatus
            ? getApplicationStatusLabel(event.newStatus, t)
            : ''
          const description = getTimelineDescription(event, newStatus, t)

          return (
            <li key={eventIdx}>
              <div className="relative pb-8">
                {eventIdx !== sortedEvents.length - 1 && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div
                      className={`relative px-1 flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <span className="text-lg">{icon}</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{description}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {format(new Date(event.date), 'PPP HH:mm', { locale: dateLocale })}
                      </p>
                    </div>
                    {event.oldStatus && event.newStatus && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
                        <span className="line-through text-gray-400">
                          {getApplicationStatusLabel(event.oldStatus, t)}
                        </span>
                        {' → '}
                        <span className="font-medium text-gray-700">{newStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function getApplicationStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations<'applications'>>
) {
  const statusKeyMap: Record<string, string> = {
    draft: 'draft',
    submitted: 'submitted',
    under_review: 'underReview',
    interview_scheduled: 'interviewScheduled',
    offer_received: 'offerReceived',
    rejected: 'rejected',
    withdrawn: 'withdrawn',
    accepted: 'accepted',
  }

  const key = statusKeyMap[status]
  return key ? t(key) : status
}

function getTimelineDescription(
  event: TimelineEvent,
  status: string,
  t: ReturnType<typeof useTranslations<'applications'>>
) {
  const eventTypeMap: Record<string, string> = {
    created: 'timelineDescriptions.created',
    submitted: 'timelineDescriptions.submitted',
    status_change: 'timelineDescriptions.status_change',
    status_changed: 'timelineDescriptions.status_changed',
    interview: 'timelineDescriptions.interview',
    offer: 'timelineDescriptions.offer',
    rejected: 'timelineDescriptions.rejected',
    withdrawn: 'timelineDescriptions.withdrawn',
    note_added: 'timelineDescriptions.note_added',
  }

  const key = eventTypeMap[event.type]
  return key ? t(key, { status }) : event.description
}

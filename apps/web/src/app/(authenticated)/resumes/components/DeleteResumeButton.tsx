'use client'

import { useState } from 'react'
import { Button } from '@careermatch/ui'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface DeleteResumeButtonProps {
  resumeId: string
  className?: string
}

export function DeleteResumeButton({ resumeId, className }: DeleteResumeButtonProps) {
  const t = useTranslations('forms.deleteResume')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }

      router.refresh()
      setShowConfirm(false)
    } catch (error) {
      console.error('Error deleting resume:', error)
      alert(t('deleteFailed'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className={`flex gap-1 ${className || ''}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isDeleting}
          className="flex-1 text-xs"
        >
          {tCommon('cancel')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 text-xs text-error-600 border-error-300 hover:bg-error-50"
        >
          {isDeleting ? t('deleting') : t('confirm')}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      className={`text-error-600 border-error-300 hover:bg-error-50 ${className || ''}`}
    >
      {t('deleteButton')}
    </Button>
  )
}

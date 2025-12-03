'use client'

import { useState } from 'react'
import { Button } from '@careermatch/ui'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface DeleteApplicationButtonProps {
  applicationId: string
}

export function DeleteApplicationButton({ applicationId }: DeleteApplicationButtonProps) {
  const t = useTranslations('forms.deleteApplication')
  const tCommon = useTranslations('common')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('deleteFailed'))
      }

      // Redirect to applications list
      router.push('/applications')
      router.refresh()
    } catch (error) {
      console.error('Error deleting application:', error)
      alert(t('deleteFailed'))
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (!showConfirm) {
    return (
      <Button
        variant="outline"
        onClick={() => setShowConfirm(true)}
        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      >
        {t('deleteButton')}
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-red-600 font-medium">{t('confirmMessage')}</div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="flex-1"
        >
          {tCommon('cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? t('deleting') : t('confirmDelete')}
        </Button>
      </div>
    </div>
  )
}

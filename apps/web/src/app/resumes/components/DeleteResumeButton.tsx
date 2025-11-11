'use client'

import { useState } from 'react'
import { Button } from '@careermatch/ui'
import { useRouter } from 'next/navigation'

export function DeleteResumeButton({ resumeId }: { resumeId: string }) {
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
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isDeleting}
          className="text-xs px-2 py-1"
        >
          取消
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs px-2 py-1 text-error-600 border-error-300 hover:bg-error-50"
        >
          {isDeleting ? '删除中...' : '确认'}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      className="text-error-600 border-error-300 hover:bg-error-50"
    >
      删除
    </Button>
  )
}

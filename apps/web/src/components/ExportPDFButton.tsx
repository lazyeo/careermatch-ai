'use client'

import { useState } from 'react'
import { Button } from '@careermatch/ui'
import { useTranslations } from 'next-intl'

interface ExportPDFButtonProps {
  resumeId: string
  resumeTitle: string
}

export function ExportPDFButton({ resumeId, resumeTitle }: ExportPDFButtonProps) {
  const t = useTranslations('forms.exportPDF')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // 调用PDF导出API
      const response = await fetch(`/api/resumes/${resumeId}/export-pdf`)

      if (!response.ok) {
        throw new Error('Failed to export PDF')
      }

      // 获取PDF blob
      const blob = await response.blob()

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()

      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert(t('exportFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="accent"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? t('exporting') : t('exportPDF')}
    </Button>
  )
}

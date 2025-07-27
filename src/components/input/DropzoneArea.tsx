'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface DropzoneAreaProps {
  onFileAccepted: (file: File) => void
}

export function DropzoneArea({ onFileAccepted }: DropzoneAreaProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        onFileAccepted(file)
      }
    },
    [onFileAccepted]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-600">PDFファイルをドロップしてください</p>
      ) : (
        <div>
          <p className="text-gray-600">PDFファイルをドラッグ＆ドロップ</p>
          <p className="text-sm text-gray-500 mt-2">またはクリックしてファイルを選択</p>
        </div>
      )}
    </div>
  )
}
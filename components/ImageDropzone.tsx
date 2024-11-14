import React from 'react'
import { useDropzone } from 'react-dropzone'

interface ImageDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void
  isProcessing: boolean
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onDrop, isProcessing }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  })

  return (
    <>
      <div 
        {...getRootProps()} 
        className="border-2 border-dashed border-gray-300 p-4 mb-4 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Solte as imagens aqui ...</p>
        ) : (
          <div>
            <p className="mb-2">Arraste e solte imagens aqui, ou clique para selecionar arquivos</p>
            <p className="text-sm text-muted-foreground">Você também pode colar imagens usando Ctrl+V</p>
          </div>
        )}
      </div>
      {isProcessing && (
        <div className="text-center py-4">
          <p>Processando imagens... Por favor, aguarde.</p>
        </div>
      )}
    </>
  )
}

export default ImageDropzone
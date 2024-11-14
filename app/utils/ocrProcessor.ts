/* eslint-disable @typescript-eslint/no-explicit-any */
import { createWorker } from 'tesseract.js'

export const initializeOCRWorker = async () => {
  const worker = await createWorker()
  await worker.loadLanguage('eng')
  await worker.initialize('eng')
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.- ',
  })
  return worker
}

export const processImage = async (file: File, worker: any) => {
  const { data: { text } } = await worker.recognize(file)
  return text
}
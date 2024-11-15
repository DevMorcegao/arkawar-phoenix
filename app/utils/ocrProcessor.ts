/* eslint-disable @typescript-eslint/no-explicit-any */
import { createWorker, Worker } from 'tesseract.js'

export const initializeOCRWorker = async () => {
  const worker = await createWorker()
  await (worker as any).loadLanguage('eng')
  await (worker as any).initialize('eng')
  await (worker as any).setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.- ',
  })
  return worker
}

export const processImage = async (file: File, worker: Worker) => {
  const { data: { text } } = await worker.recognize(file)
  return text
}
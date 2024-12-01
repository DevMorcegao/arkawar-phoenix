type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogData {
  id?: string
  [key: string]: any
}

class Logger {
  private static instance: Logger
  private isDevelopment: boolean

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  private formatMessage(level: LogLevel, context: string, message: string, data?: LogData): string {
    const timestamp = this.formatDate(new Date())
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
  }

  private log(level: LogLevel, context: string, message: string, data?: LogData) {
    if (!this.isDevelopment) return

    const formattedMessage = this.formatMessage(level, context, message, data)

    switch (level) {
      case 'error':
        console.error(formattedMessage, data || '')
        break
      case 'warn':
        console.warn(formattedMessage, data || '')
        break
      case 'info':
        console.info(formattedMessage, data || '')
        break
      case 'debug':
        console.debug(formattedMessage, data || '')
        break
    }
  }

  public error(context: string, message: string, data?: LogData) {
    this.log('error', context, message, data)
  }

  public warn(context: string, message: string, data?: LogData) {
    this.log('warn', context, message, data)
  }

  public info(context: string, message: string, data?: LogData) {
    this.log('info', context, message, data)
  }

  public debug(context: string, message: string, data?: LogData) {
    this.log('debug', context, message, data)
  }
}

export const logger = Logger.getInstance()

import winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: isDev ? 'info' : 'info',
  format: isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${extras}`;
        })
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
  transports: [new winston.transports.Console()],
});

import winston from 'winston';

// Define log levels with colors
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

winston.addColors(logColors);

// Create custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, context }) => {
        const contextStr = context ? `[${context}]` : '';
        return `[${level}] ${contextStr} ${message}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
    ),
    transports: [
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

// Add file transport for debug logs if LOG_FILE is set
if (process.env.LOG_FILE) {
    logger.add(new winston.transports.File({
        filename: process.env.LOG_FILE,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));
}

// Create context-specific loggers
export const stepLogger = {
    info: (message: string) => logger.info(message, { context: 'STEP' }),
    debug: (message: string) => logger.debug(message, { context: 'STEP' }),
    warn: (message: string) => logger.warn(message, { context: 'STEP' }),
    error: (message: string) => logger.error(message, { context: 'STEP' })
};

export const pageLogger = {
    info: (message: string) => logger.info(message, { context: 'PAGE' }),
    debug: (message: string) => logger.debug(message, { context: 'PAGE' }),
    warn: (message: string) => logger.warn(message, { context: 'PAGE' }),
    error: (message: string) => logger.error(message, { context: 'PAGE' })
};

export const hookLogger = {
    info: (message: string) => logger.info(message, { context: 'HOOK' }),
    debug: (message: string) => logger.debug(message, { context: 'HOOK' }),
    warn: (message: string) => logger.warn(message, { context: 'HOOK' }),
    error: (message: string) => logger.error(message, { context: 'HOOK' })
};

export const dbLogger = {
    info: (message: string) => logger.info(message, { context: 'DB' }),
    debug: (message: string) => logger.debug(message, { context: 'DB' }),
    warn: (message: string) => logger.warn(message, { context: 'DB' }),
    error: (message: string) => logger.error(message, { context: 'DB' })
};

export default logger;

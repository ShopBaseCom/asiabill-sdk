const winston = require('winston');

const logger = winston.createLogger({
  transports: [],
});

if (!!process.env.LOG_CONSOLE) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack: true}),
        winston.format.colorize(),
        winston.format.simple(),
    ),
  }));
}

if (!!process.env.LOG_FILE) {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple(),
        winston.format.errors({stack: true}),
    ),
  }));
}

module.exports = logger.child({label: 'AsiaBill'});

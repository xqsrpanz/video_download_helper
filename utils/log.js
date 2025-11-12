import { LOG_PREFIX } from '../config/constants.js';

function log(...contents) {
  console.log(LOG_PREFIX, ...contents);
}

function err(...contents) {
  console.error(LOG_PREFIX, ...contents);
}

function info(...contents) {
  console.info(`%c${LOG_PREFIX}`, 'color: #2f94fa;', ...contents);
}

function warn(...contents) {
  console.warn(LOG_PREFIX, ...contents);
}

export { log, err, info, warn };

import { LOG_PREFIX } from '@/config/constants';

export function useLog (namespace = LOG_PREFIX, prefixColor = '#2f94fa', timerColor = 'red') {
  const color = `color: ${prefixColor};`;
  const timerC = `color: ${timerColor};`;

  function log (...contents: any[]) {
    console.log(`%c${namespace}`, color, ...contents);
  }
  function err (...contents: any[]) {
    console.error(`%c${namespace}`, color, ...contents);
  }
  function info (...contents: any[]) {
    console.info(`%c${namespace}`, color, ...contents);
  }
  function warn (...contents: any[]) {
    console.warn(`%c${namespace}`, color, ...contents);
  }

  const timeMap = new Map();
  function time (label: string, ...contents: any[]) {
    timeMap.set(label, Date.now());
    console.log(`%c${namespace}%c${label}`, color, timerC, 'start', ...contents);
  }
  function timeEnd (label: string, unit = 'ms', ...contents: any[]) {
    const startTime = timeMap.get(label);
    if (startTime) {
      const endTime = Date.now();
      let duration = endTime - startTime;
      if (unit === 's') {
        duration = duration / 1000;
      } else if (unit === 'min') {
        duration = duration / 6000;
      }
      console.log(`%c${namespace}%c${label}`, color, timerC, `end, cost: ${duration} ${unit}`, ...contents);
      timeMap.delete(label);
      return duration;
    }
  }
  return {
    log,
    err,
    info,
    warn,
    time,
    timeEnd,
  };
}

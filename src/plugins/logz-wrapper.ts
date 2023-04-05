import events from 'events';
import { EventEmitter } from 'stream';

interface LogFunc {
  (payload: Object): null;
}

interface LogzLogger {
  log: LogFunc;
}

interface LogzWrapperOptions {
  token: string;
  host: string;
}

class LogzWrapper {
  logger: LogzLogger;
  eventEmitter: EventEmitter;

  constructor(options: LogzWrapperOptions) {
    this.logger = require('logzio-nodejs').createLogger({
      token: options.token || '',
      protocol: 'https',
      host: options.host || '',
      port: '8071',
      type: 'nodejs',
    });
    this.eventEmitter = new events.EventEmitter();
    this.eventEmitter.on('logz', (data: string) => {
      this.logger.log(JSON.parse(data));
    });
  }

  log(payload: string) {
    /**
     * I used an event emitter here instead of directly using this.logger.log because it seemed that logz 
     * was getting in the way of Pino's sync execution and I observed some strange blocking behavior. I'm not
     * sure this will alleviate the problem. If it doesn't, i.e. if the combination of pino and logz, or maybe logz in general
     * seems to slow down / block the server, we can extract it to a separate server/service and just pipe the laabr/pino output.
     * e.g. in package.json - "start": "node dist/index.js | xargs -I {} ./log.sh {}",
     */
    this.eventEmitter.emit('logz', payload);
  }
}

export default LogzWrapper;

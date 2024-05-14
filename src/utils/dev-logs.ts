import { configLoggerType, logger } from 'react-native-logs';

const config: configLoggerType = {
	transportOptions: {
		colors: {
			info: 'blue',
			warn: 'yellow',
			error: 'red',
			debug: 'green',
		},
		extensionColors: {
			root: 'red',
			flow: 'magenta',
		},
	},
	enabledExtensions: ['root', 'flow'],
};

export const log = logger.createLogger(config);

export const rootLog = log.extend('root');
export const flowLog = log.extend('flow');

export class TimeLog {
	static readonly TAG = '[DEV]';
	private readonly _label: string;

	constructor(label: string) {
		this._label = `⏱ ${label}`;
		this.start();
	}

	private start(): void {
		console.time(this._label);
		console.log(`${this._label} ▶️`);
	}

	log(...optionalParams: any[]): void {
		console.timeLog(this._label, optionalParams);
	}

	end(): void {
		console.timeEnd(this._label);
	}
}

/**
 * Global record to handle timelogs across different files.
 */
export const timers: Record<string, TimeLog> = {};

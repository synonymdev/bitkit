export default class TimeLog {
	static readonly TAG = '[DEV]';
	private readonly _label: string;

	constructor(label: string) {
		this._label = `[⏱ ${label}]`;
		this.start();
	}

	private start(): void {
		console.time(this._label);
		console.debug(`${this._label}: started timer`);
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

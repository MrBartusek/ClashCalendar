import chalk, { ChalkInstance } from 'chalk';

export default class Logger {
	public static critical(message: string): void {
		this.log('CRITICAL', message);
		process.exit(1);
	}

	public static error(message: string): void {
		this.log('ERROR', message);
	}

	public static warn(message: string): void {
		this.log('WARN', message);
	}

	public static info(message: string): void {
		this.log('INFO', message);
	}

	private static log(severity: 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO', message: string): void {
		const color = this.getColor(severity);
		console.log(color.bold(`[${severity}] `) + color(message));
	}

	private static getColor(severity: 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO'): ChalkInstance {
		switch(severity) {
			case 'CRITICAL':
			case 'ERROR':
				return chalk.red;
			case 'WARN':
				return chalk.yellow;
			case 'INFO':
			default:
				return chalk.white;
		}
	}
}

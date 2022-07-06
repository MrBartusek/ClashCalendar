import chalk from 'chalk';
import { ApiError } from 'shieldbow';

export default class Utils {
	// Convert string to tile
	// some text => Some TEXT
	public static title(input: string): string {
		return input.split(' ').map((word) => {
			return word[0].toUpperCase() + word.substring(1);
		}).join(' ');
	}

	// Convert number of seconds to friendly H hours M minutes
	// This uses &nbsp; for spaces
	public static formatDuration(input: number): string {
		const hours   = Math.floor(input / 3600);
		const minutes = Math.floor((input - (hours * 3600)) / 60);

		let result = '';
		if(hours > 0) {
			result += `${hours}&nbsp;hour${hours > 1 ? 's' : ''}`;
		}
		if(hours > 0 && minutes > 0) {
			result += '&nbsp;and&nbsp;';
		}
		if(minutes > 0) {
			result += `${minutes}&nbsp;minute${minutes > 1 ? 's' : ''}`;
		}
		return result;
	}

	// Format date to hh:mm:ss dd/mm/yyyy
	public static formatDate(input: Date): string {
		const date = new Date(input);
		const dd = date.getDate().toString().padStart(2, '0');
		const min = (date.getMonth()+1).toString().padStart(2, '0');
		const yyyy = date.getFullYear().toString().padStart(4, '0');
		const hh = date.getHours().toString().padStart(2, '0');
		const mo = date.getMinutes().toString().padStart(2, '0');
		const ss = date.getSeconds().toString().padStart(2, '0');
		return `${hh}:${min}:${ss} ${dd}/${mo}/${yyyy}`;
	}

	public static formatAPIError(error: ApiError): string {
		if(!(error instanceof ApiError)) return error;
		let response = error.response.data;
		if(typeof response == 'object') {
			response = JSON.stringify(response);
		}
		return [
			`${chalk.bold('Request:')} ${error.request}`,
			`${chalk.bold('URL:')} ${error.response.config.url}`,
			`${chalk.bold('Response:')} HTTP ${error.response.status}: ${error.response.statusText}`,
			response
		].join('\r\n');
	}
}

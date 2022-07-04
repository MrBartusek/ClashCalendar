export default class Utils {
	// Convert string to tile
	// some text => Some TEXT
	public static title(input: string): string {
		return input.split(' ').map((word) => {
			return word[0].toUpperCase() + word.substring(1);
		}).join(' ');
	}

	public static formatDuration(input: number): string {
		const hours   = Math.floor(input / 3600);
		const minutes = Math.floor((input - (hours * 3600)) / 60);

		let result = '';
		if(hours > 0) {
			result += `${hours}&nbsp;hour${hours > 1 ? 's' : ''}`;
		}
		if(hours > 0 && minutes > 0) {
			result += '&nbsp;adn&nbsp;';
		}
		if(minutes > 0) {
			result += `${minutes}&nbsp;minute${minutes > 1 ? 's' : ''}`;
		}
		return result;
	}

	public static formatDate(input: Date): string {
		const date = new Date(input);
		return `${
			(date.getMonth()+1).toString().padStart(2, '0')}/${
			date.getDate().toString().padStart(2, '0')}/${
			date.getFullYear().toString().padStart(4, '0')} ${
			date.getHours().toString().padStart(2, '0')}:${
			date.getMinutes().toString().padStart(2, '0')}:${
			date.getSeconds().toString().padStart(2, '0')}`;
	}
}

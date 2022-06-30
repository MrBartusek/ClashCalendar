import * as calendar from '@googleapis/calendar';
import Logger from './logger.js';
import chalk from 'chalk';
import * as fs from 'fs';
import config from '../config/config.json';
import { Region, round } from 'shieldbow';

const SERVICE_ACCOUNT_PATH = 'keys/service-account.json';

export default class GoogleWrapper {
	public client!: calendar.calendar_v3.Calendar;

	constructor() {
		this.shareCalendar = this.shareCalendar.bind(this);
	}

	async initialize(): Promise<GoogleWrapper> {
		Logger.info('Initializing Google Client...');

		// Start the connection
		if(!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
			Logger.critical('Service account key is not provided');
		}
		const auth = new calendar.auth.GoogleAuth({
			keyFilename: SERVICE_ACCOUNT_PATH,
			scopes: ['https://www.googleapis.com/auth/calendar']
		});
		const authClient = await auth.getClient() as any;
		const client = calendar.calendar({
			version: 'v3',
			auth: authClient
		});

		// Finalize
		const calendarCount = (await client.calendarList.list()).data.items?.length;
		Logger.info(`Logged in to Google as: ${chalk.green(authClient.email)} with ${chalk.green(calendarCount)} calendars`);
		this.client = client;
		return this;
	}

	async updateCalendarsStructure(): Promise<void> {
		Logger.info('Checking calendars structure...');

		const structure = this.getStructure();
		const calendars = (await this.client.calendarList.list()).data.items!;
		const invalidCalenders = calendars.filter(c => !structure.includes(c.summary!));
		let missingCalendars = structure.filter(s => !calendars.map(c => c.summary).includes(s));

		if(invalidCalenders.length > 0 || missingCalendars.length > 0) {
			Logger.warn(`There are ${invalidCalenders.length} invalid calendars and ${missingCalendars.length} calendars missing`);
		}

		// Delete invalid calendars
		for await(const calendar of invalidCalenders) {
			await this.client.calendars.delete({ calendarId: calendar.id! });
			Logger.info(`${chalk.red('DELETE CALENDAR')} ${calendar.summary} (Calendar doesn't match structure)`);
		}
		// Create missing calendars
		for await(const structureCalendarName of missingCalendars) {
			const successful = await this.client.calendars.insert({ requestBody: { summary: structureCalendarName }})
				.then(c => c.data)
				.then(this.shareCalendar)
				.then(c => {
					Logger.info(`${chalk.green('CREATE CALENDAR')} ${c.summary} ${chalk.gray(c.id)}`);
					return true;
				})
				.catch((error: any) => {
					if(missingCalendars.length < structure.length && error.response?.status == 403) {
						Logger.warn('Cannot create a missing calendar: ' + error);
						return false;
					}
					else {
						throw error;
					}
				});
			if(!successful) break;
		}

		missingCalendars = structure.filter(s => !calendars.map(c => c.summary).includes(s));

		if(missingCalendars.length > 0) {
			const structurePercentage = Math.round(((structure.length - missingCalendars.length) / structure.length) * 100);
			Logger.warn(`Created partial calendars structure (${structurePercentage}%)`);
		}
		else {
			Logger.info('Calendars structure is valid');
		}
	}

	async shareCalendar(calendar: calendar.calendar_v3.Schema$Calendar): Promise<calendar.calendar_v3.Schema$Calendar> {
		await this.client.acl.insert({
			calendarId: calendar.id!,
			requestBody: {
				role: 'reader',
				scope: {
					type: 'default'
				}
			}
		});
		return calendar;
	}

	getStructure(): string[] {
		const structure: string[] = [];
		for(const region of config.regions) {
			for(const tier of [undefined, 1, 2, 3, 4]) {
				structure.push(this.getCalendarName(region.name as Region, tier));
			}
		}
		return structure;
	}

	getCalendarName(region: Region, tier?: number) {
		if(tier) {
			return `Clash - ${region.toUpperCase()} - Tier ${tier}`;
		}
		else {
			return `Clash - ${region.toUpperCase()}`;
		}

	}
}

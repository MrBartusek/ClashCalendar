import * as calendar from '@googleapis/calendar';
import Logger from './logger.js';
import chalk from 'chalk';
import * as fs from 'fs';
import { Region } from 'shieldbow';
import { ALL_TIERS, ClashTier } from './riot_wrapper.js';

const SERVICE_ACCOUNT_PATH = 'keys/service-account.json';

export default class GoogleWrapper {
	public client!: calendar.calendar_v3.Calendar;
	private regions: Region[];
	private calendarList: calendar.calendar_v3.Schema$CalendarListEntry[];

	constructor(regions: Region[]) {
		this.regions = regions;
		this.calendarList = [];
		this.shareCalendar = this.shareCalendar.bind(this);
	}

	public async initialize(): Promise<GoogleWrapper> {
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
		this.client = client;
		this.calendarList = await this.listCalendars();
		Logger.info(`Logged in to Google as: ${chalk.green(authClient.email)} with ${chalk.green(this.calendarList.length)} calendars`);
		return this;
	}

	public async updateCalendarsStructure(): Promise<void> {
		Logger.info('Checking calendars structure...');

		// Initial structure check
		const structure = this.getStructure();
		let calendars = await this.listCalendars();
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

		// Finalize
		calendars = await this.listCalendars();
		this.calendarList = calendars;
		missingCalendars = structure.filter(s => !calendars.map(c => c.summary).includes(s));
		if(missingCalendars.length > 0) {
			const structurePercentage = Math.round(((structure.length - missingCalendars.length) / structure.length) * 100);
			Logger.warn(`Created partial calendars structure (${structurePercentage}%)`);
		}
		else {
			const expectedCalendars = this.regions.length * 5;
			if(this.calendarList.length !== expectedCalendars) {
				Logger.critical(`Invalid calendars count. Expected: ${expectedCalendars} Got: ${this.calendarList.length}`);
			}
			Logger.info(`Calendars structure is ${chalk.green('valid')} with ${chalk.green(this.calendarList.length)} calendars`);
			this.generateStructureFile();
		}
	}

	private async listCalendars(): Promise<calendar.calendar_v3.Schema$CalendarListEntry[]> {
		const list = (await this.client.calendarList.list({
			maxResults: 250,
			minAccessRole: 'owner'
		}));
		return list.data.items!;
	}

	private async shareCalendar(calendar: calendar.calendar_v3.Schema$Calendar): Promise<calendar.calendar_v3.Schema$Calendar> {
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

	private getCalendarName(region: Region, tier: ClashTier) {
		if(tier == ClashTier.UNIVERSAL) {
			return `Clash - ${region.toUpperCase()}`;
		}
		else {
			return `Clash - ${region.toUpperCase()} - Tier ${Number(tier)}`;
		}
	}

	private getStructure(): string[] {
		const structure: string[] = [];
		for(const region of this.regions) {
			for(const tier of ALL_TIERS) {
				structure.push(this.getCalendarName(region, tier));
			}
		}
		return structure;
	}

	public getCalendarByRegion(region: Region, tier: ClashTier): calendar.calendar_v3.Schema$Calendar | undefined {
		const name = this.getCalendarName(region, tier);
		const calendar = this.calendarList.find(c => c.summary == name);
		if(!calendar) return undefined;
		return calendar;
	}

	public async listEvents(calendar: calendar.calendar_v3.Schema$Calendar) {
		const date = new Date();
		date.setHours(date.getHours() + 24);

		const list = await this.client.events.list({
			calendarId: calendar.id!,
			timeMin: date.toISOString(),
			singleEvents: true,
			orderBy: 'startTime',
			maxResults: 2500
		});
		return list.data.items!;
	}

	private generateStructureFile() {
		const result: any = {};
		for(const region of this.regions) {
			result[region] = {};
			for(const tier of ALL_TIERS) {
				const calendar = this.getCalendarByRegion(region, tier);
				if(!calendar) throw Error(`Cannot generate structure file, calendar is missing ${region} - ${tier}`);
				result[region][tier] = calendar.id;
			}
		}
		fs.writeFileSync('structure.json', JSON.stringify(result, null, 2));
		Logger.info(`Saved structure to ${chalk.green('structure.json')}`);
	}
}

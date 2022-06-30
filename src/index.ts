import * as Shieldbow from 'shieldbow';
import Logger from './logger.js';
import chalk from 'chalk';
import GoogleWrapper from './calendar_wrapper.js';
import config from '../config/config.json';
import schedule from 'node-schedule';
import { Region } from 'shieldbow';

const MINUTES = 60*60, HOURS = MINUTES * 60;

class ClashCalendar {
	private shieldbow!: Shieldbow.Client;
	private google!: GoogleWrapper;

	async initializeShieldbow(): Promise<Shieldbow.Client> {
		Logger.info('Initializing Shieldbow client...');
		if(process.env.RIOT_API_KEY === undefined) {
			Logger.critical('RIOT_API_KEY is not provided');
		}
		const client = new Shieldbow.Client(process.env.RIOT_API_KEY!);
		await client.initialize({
			region: 'eune',
			fetch: {
				champions: false,
				items: false,
				runes: false,
				summonerSpells: false
			}
		});
		Logger.info(`Successfully initialized Shieldbow client on path ${chalk.green(client.patch)}`);
		return client;
	}

	async start() {
		Logger.info('Starting ClashCalendar updater...');
		this.shieldbow = await this.initializeShieldbow();
		this.google = await new GoogleWrapper().initialize();
		await this.google.updateCalendarsStructure();
		await this.updateClashes();
		Logger.info('Successfully started ClashCalendar updater!');
	}

	async updateClashes() {
		Logger.info('Updating clashes...');
		for(const region of config.regions) {
			const clashes = await this.shieldbow.clash.fetchAll({ region: region.name as Region });
			for(const clash of clashes) {
				console.log((clash.schedule[0].startTimestamp - clash.schedule[0].registrationTimestamp) / 1000 / 60 / 60);
			}
		}

	}
}

await new ClashCalendar().start();

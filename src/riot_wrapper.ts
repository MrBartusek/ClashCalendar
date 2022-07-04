import Logger from './logger.js';
import chalk from 'chalk';
import * as Shieldbow from 'shieldbow';
import Utils from './utils.js';

export enum ClashTier {
	UNIVERSAL = 0,
	ONE = 1,
	TWO = 2,
	THREE = 3,
	FOUR = 4
}

export const ALL_TIERS = [ClashTier.UNIVERSAL, ClashTier.ONE, ClashTier.TWO, ClashTier.THREE, ClashTier.FOUR];

export default class RiotWrapper {
	public client!: Shieldbow.Client;

	async initialize(): Promise<RiotWrapper> {
		Logger.info('Initializing Shieldbow client...');
		// Check if key exist
		if(process.env.RIOT_API_KEY === undefined) {
			Logger.critical('Environment variable RIOT_API_KEY is not provided');
		}
		// Initalize client
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
		// Check if key is valid
		try {
			await client.status;
		}
		catch(error: any) {
			if(error.response.status == 403) {
				Logger.critical('Provided RIOT_API_KEY is invalid or expired');
			}
			else {
				throw error;
			}
		}

		Logger.info(`Successfully initialized Shieldbow client on patch ${chalk.green(client.patch)}`);
		this.client = client;
		return this;
	}

	public formatClashName(clash: Shieldbow.Tournament): string {
		const title = Utils.title(clash.title.replaceAll('_', ' '));
		const subtitle = Utils.title(clash.subtitle.replaceAll('_', ' '));
		return `${title} Cup ◇ ${subtitle}`;
	}

	public getClashRegisterTime(clash: Shieldbow.Tournament, tier: ClashTier): Date {
		const schedule = clash.schedule[0];
		return this.substractSeconds(schedule.startTime, this.getClashLockWindow(clash, tier));
	}

	public getClashLockWindow(clash: Shieldbow.Tournament, tier: ClashTier): number {
		const schedule = clash.schedule[0];
		const MINUTES = 60;
		const HOURS =  MINUTES * 60;
		switch (tier) {
			case ClashTier.ONE:
				return 0.5 * HOURS;
			case ClashTier.TWO:
				return 1 * HOURS;
			case ClashTier.THREE:
				return 1.5 * HOURS;
			case ClashTier.FOUR:
			case ClashTier.UNIVERSAL:
				return (schedule.startTimestamp - schedule.registrationTimestamp) / 1000;
		}
	}

	private substractSeconds(date: Date, seconds: number): Date {
		const dateCopy = new Date(date);
		dateCopy.setSeconds(date.getSeconds() - seconds);
		return dateCopy;
	}
}

import Logger from './logger.js';
import chalk from 'chalk';
import GoogleWrapper from './calendar_wrapper.js';
import { ApiError, Region, Tournament } from 'shieldbow';
import RiotWrapper, { ALL_TIERS, ClashTier } from './riot_wrapper.js';
import * as schedule from 'node-schedule';
import Utils from './utils.js';

const REGIONS: Region[] = ['eune', 'euw', 'na', 'br', 'lan', 'las', 'oce', 'kr', 'ru', 'tr', 'jp'];
enum RegionUpdateResult {
	FAILED,
	UPDATED,
	CALENDAR_MISSING
}

// Minute on which cronjobs will run,
// if you are running own instance set it to something random
const JITTER = '24';

class ClashCalendar {
	private riot!: RiotWrapper;
	private google!: GoogleWrapper;

	async start() {
		Logger.info('Starting ClashCalendar updater...');
		this.riot = await new RiotWrapper().initialize();
		this.google = await new GoogleWrapper(REGIONS).initialize();
		await this.google.updateCalendarsStructure();
		await this.updateEvents();

		const eventsJob = schedule.scheduleJob(`${JITTER} */3 * * *`, async () => {
			await this.updateEvents();
		});
		const structureJob = schedule.scheduleJob(`${JITTER} 1 * * *`, async () => {
			await this.google.updateCalendarsStructure();
		});

		const eventsJobNext = Utils.formatDate((eventsJob.nextInvocation() as any)._date);
		const structureJobNext = Utils.formatDate((structureJob.nextInvocation() as any)._date);
		Logger.info(chalk.green('Successfully started ClashCalendar!'));
		Logger.info('Next updates will now run on schedule:');
		Logger.info(
			`${chalk.bold('Events update job')} every 3 hours - ` +
			`Next execution: ${chalk.green(eventsJobNext)}`);
		Logger.info(
			`${chalk.bold('Structure update job')} every 24 hours - ` +
			`Next execution: ${chalk.green(structureJobNext)}`);
		Logger.separator();
	}

	async updateEvents() {
		Logger.info('Updating events...');
		const results: Record<Region,RegionUpdateResult> = {} as Record<Region,RegionUpdateResult>;
		for(const region of REGIONS) {
			await this.updateRegion(region)
				.then((r) => results[region] = r)
				.catch((error: ApiError) => {
					Logger.error(`Failed to update region: ${chalk.bold(region.toUpperCase())}. The rest of the regions updates will continue`);
					Logger.error(Utils.formatAPIError(error));
					results[region] = RegionUpdateResult.FAILED;
				});
		}
		Logger.separator();
		Logger.info('CLASH CALENDAR REGIONS UPDATE SUMMARY:');
		for(const [region, result] of Object.entries(results!)) {
			let color = chalk.gray;
			if(result == RegionUpdateResult.CALENDAR_MISSING) {
				color = chalk.yellow;
			}
			else if(result == RegionUpdateResult.UPDATED) {
				color = chalk.green;
			}
			else if(result == RegionUpdateResult.FAILED) {
				color = chalk.red;
			}
			Logger.info(`${color(`● ${chalk.bold(region.toLocaleUpperCase().padEnd(4))}`)} - ${RegionUpdateResult[result]}`);
		}
		Logger.separator();
	}

	async updateRegion(region: Region): Promise<RegionUpdateResult> {
		const clashes = await this.riot.client.clash.fetchAll({ region: region });
		if(!clashes.every(c => c.schedule.length == 1)) throw Error('Invalid clash schedule length');
		clashes.sort((a,b) => a.schedule[0].startTimestamp - b.schedule[0].startTimestamp);
		clashes.filter(c => !c.schedule[0].cancelled);
		let anyCalendarMissing = false;

		for(const tier of ALL_TIERS) {
			Logger.info(`Updating calendar: ${chalk.green(`Region: ${region.toUpperCase()} | Tier: ${ClashTier[tier]}`)}`);
			const calendar = this.google.getCalendarByRegion(region, tier);
			if(!calendar) {
				Logger.warn('This calendar is missing from calendars list and won\'t be updated at this time');
				anyCalendarMissing = true;
				continue;
			}

			const events = await this.google.listEvents(calendar);
			const clashesNames = clashes.filter(c => c.schedule[0]).map(c => this.riot.formatClashName(c));
			const eventNames = events.map(e => e.summary);
			const invalidEvents = events.filter(e => !clashesNames.includes(e.summary || ''));
			invalidEvents.filter(e => (+new Date() - +new Date(e.start!.dateTime!)) > 0); // Don't delete old events
			const missingEvents = clashes.filter(c => !eventNames.includes(this.riot.formatClashName(c)));

			// Delete invalid events
			for await(const event of invalidEvents) {
				await this.google.client.events.delete({ calendarId: calendar.id!, eventId: event.id!});
				Logger.info(`${chalk.red('DELETE EVENT')} ${event.summary} (Event not in clash API)`);
			}

			// Create missing events
			for await(const clash of missingEvents) {
				const schedule = clash.schedule[0];
				const event = await this.google.client.events.insert({
					calendarId: calendar.id!,
					requestBody: {
						summary: this.riot.formatClashName(clash),
						description: this.generateEventDescription(clash, tier, region),
						start: {
							dateTime: this.riot.getClashRegisterTime(clash, tier).toISOString()
						},
						end: {
							dateTime: schedule.startTime.toISOString()
						}
					}
				});
				Logger.info(`${chalk.green('CREATE EVENT')} ${event.data.summary!} ${chalk.gray(event.data.id!)}`);
			}
		}

		return anyCalendarMissing ? RegionUpdateResult.CALENDAR_MISSING : RegionUpdateResult.UPDATED;
	}

	generateEventDescription(clash: Tournament, tier: ClashTier, region: Region): string {
		const title = Utils.title(clash.title.replaceAll('_', ' '));
		const html = `<html-blob><u></u><u></u>
			This is an automatic event for <b>${title} Cup</b>
			${tier != ClashTier.UNIVERSAL ? ` in&nbsp;<b>Tier&nbsp;${tier}</b>` : ''} on&nbsp;<b>${region.toUpperCase()}</b>.
			${tier != ClashTier.UNIVERSAL ? 'The lock-in window for this tier ' : 'This clash'} 
			lasts&nbsp;<b>${Utils.formatDuration(this.riot.getClashLockWindow(clash, tier))}</b>. 
			Good&nbsp;Luck!<br><br>
			📅 Created by&nbsp;<b>ClashCalendar</b><br>
			<a href=\"http://dokurno.dev/ClashCalendar\">Website</a> | 
			<a href=\"https://github.com/MrBartusek/ClashCalendar\">Github</a> | 
			<a href=\"https://github.com/MrBartusek/ClashCalendar/issues\">Report Issue</a> | 
			<a href=\"https://support-leagueoflegends.riotgames.com/hc/en-us/articles/360000951548-Clash-FAQ\">What&nbsp;is&nbsp;Clash?</a>
		<u></u><u></u></html-blob>`;
		return html
			.replaceAll('\t','')
			.replaceAll('\r', '')
			.replaceAll('\n', '');
	}

}

process.on('SIGINT', function () {
	schedule.gracefulShutdown()
		.then(() => process.exit(0));
});

await new ClashCalendar().start();

export default {
	apps:
	[{
		name: 'ClashCalendar',
		script: 'dist/index.js',
		max_memory_restart: '200M',
		wait_ready: false,
		max_restarts: 10,
		restart_delay: 60000
	}]
};

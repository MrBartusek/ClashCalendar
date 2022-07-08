let currentRegion = 'eune';
let currentTier = 4;
let calendar = undefined;
let structure = [];

// This is default API key for Google Calendar
// If you are hosting own instance change it to your own
const DEFAULT_API_KEY = 'AIzaSyDe3krfQ81EgchKN7vk56DxPopQQYFnJNU';

document.addEventListener('DOMContentLoaded', async function() {
	const apiKey = Cookies.get('GOOGLE_API_KEY') || DEFAULT_API_KEY;
	const calendarEl = document.getElementById('calendar');
	calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		//TODO: This is production-restricted key. Add ability to use development keys
		googleCalendarApiKey: apiKey,
		themeSystem: 'bootstrap5',
		eventTimeFormat: {
			hour: 'numeric',
			minute: '2-digit',
			hour12: false
		},
		firstDay: 1,
		height: 'auto',
		nextDayThreshold: '23:59:59',
		loading: function(loading) {
			if(loading) {
				$('#calendar-spinner').show();
				$('#calendar').css('opacity', 0.3);
			}
			else {
				$('#calendar-spinner').hide();
				$('#calendar').css('opacity', 1);
			}

		},
		eventClick: function(info) {
			info.jsEvent.preventDefault();
		},
		eventDidMount: function(info) {
			const title = `
                <b>${info.timeText}</b> ${info.event.title}<br>
                <a href='${info.event.url}' target='_blank'>See in Google Calendar</a>`;
			new bootstrap.Tooltip(info.el, {
				title: title,
				html: true,
				sanitize: false,
				placement: 'top',
				trigger: 'click',
				container: 'body'
			});
		},
		validRange: function() {
			return {
				start: new Date().setMonth(new Date().getMonth() - 1),
				end: new Date().setMonth(new Date().getMonth() + 3)
			};
		},
		eventSourceSuccess: function () {
			$('#calendarUpdateError').removeClass('d-flex');
			$('#calendarUpdateError').addClass('d-none');
		},
		eventSourceFailure: function() {
			$('#calendarUpdateError').addClass('d-flex');
			$('#calendarUpdateError').removeClass('d-none');
		}
	});
	calendar.render();
	structure = await fetch('structure.json').then(response => response.json());
	updateCalendarAndImport();
});

$('#regionSelect').change(function (e) {
	currentRegion = $(this).find(':selected').val();
	updateCalendarAndImport();
});

$('#tierSelect').change(function (e) {
	currentTier = $(this).find(':selected').val();
	updateCalendarAndImport();
});

function updateCalendarAndImport() {
	const id = structure[currentRegion][currentTier];
	calendar.setOption('events', {
		googleCalendarId: id
	});

	$('#calendarIdInput').val(id);
	$('#calendarICalInput').val(`https://calendar.google.com/calendar/ical/${id}/public/basic.ics`);
	$('#calendarImportButton').attr('href', `https://calendar.google.com/calendar?cid=${id}`);
}

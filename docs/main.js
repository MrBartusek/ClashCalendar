let currentRegion = 'eune';
let currentTier = 4;
let calendar = undefined;
let structure = [];

document.addEventListener('DOMContentLoaded', function() {
	const calendarEl = document.getElementById('calendar');
	calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		googleCalendarApiKey: 'AIzaSyD8BFDNZXvWv7K3vElw3d06iUtVEz8tqxU',
		themeSystem: 'bootstrap5',
		events: {
			googleCalendarId: 'iljeqeir5g0h6cjot1mbvfom80@group.calendar.google.com'
		},
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
		}
	});
	calendar.render();
	fetch('structure.json')
		.then(response => response.json())
		.then(response => structure = response);
});

$('#regionSelect').change(function (e) {
	currentRegion = $(this).find(':selected').val();
	updateCalendar();
});

$('#tierSelect').change(function (e) {
	currentTier = $(this).find(':selected').val();
	updateCalendar();
});

function updateCalendar() {
	calendar.setOption('events', {
		googleCalendarId: structure[currentRegion][currentTier]
	});
}

let currentRegion = 'eune';
let currentTier = 4;
let calendar = undefined;
let structure = [];
let clipboard = undefined;

// This is default API key for Google Calendar
// If you are hosting own instance change it to your own
const DEFAULT_API_KEY = 'AIzaSyDe3krfQ81EgchKN7vk56DxPopQQYFnJNU';

document.onreadystatechange = async function() {
	if (document.readyState != 'complete') return;
	const apiKey = Cookies.get('GOOGLE_API_KEY') || DEFAULT_API_KEY;
	const calendarEl = document.getElementById('calendar');
	const use12hour = Intl.DateTimeFormat([],  { hour: 'numeric' }).resolvedOptions().hourCycle == 'h12';
	calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		googleCalendarApiKey: apiKey,
		themeSystem: 'bootstrap5',
		eventTimeFormat: {
			hour: 'numeric',
			minute: '2-digit',
			// Honestly this option should not be needed. This wired thing called Intl.DateTimeFormat
			// should actually detect which hour cycle user is using, and it does that when rendering
			// popovers in eventDidMount! It doesn't work here though, some wired behavior of full calendar.
			hour12: use12hour
		},
		firstDay: 1, // Set first day to Monday
		height: 'auto',
		nextDayThreshold: '23:59:59', // Don't create multiple day events
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
		eventDidMount: function(info) {
			let day = info.event.start.toLocaleTimeString('en', {weekday: 'long', month: 'long', day: 'numeric'});

			// For some reason this sometimes generates minutes hours and seconds when it's not supposed to?
			// So remove everything that's not needed
			daySplit  = day.split(', ');
			if(daySplit.length == 3) {
				daySplit.pop();
				day = daySplit.join(', ');
			}

			const startTime = info.event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'});
			const endTime = info.event.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit'});

			new bootstrap.Popover(info.el, {
				title: `
					<div class='container'>
						<div class='col'>
							<div class='row d-flex align-items-stretch mb-1'>${info.event.title}</div>
							<div class='row text-muted fw-normal' style='font-size: 0.85em'>${day} ${startTime} ⋅ ${endTime}</div>
						</div>
					</div>`,
				content: info.event.extendedProps.description,
				html: true,
				sanitize: false,
				placement: 'top',
				trigger: 'click',
				container: 'body'
			});
		},
		eventClick: function(info) {
			// Disable displaying event in google calendar upon clicking
			info.jsEvent.preventDefault();
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
	// Load bootstrap tooltips
	const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
	[...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

	// Load copy to clipboard buttons
	clipboard = new ClipboardJS('.btn');
	clipboard.on('success', function(e) {
		const tooltip = new bootstrap.Tooltip(e.trigger, {
			title: 'Copied!',
			trigger: 'hover'
		});
		$(e.trigger).children().removeClass('bi-clipboard-fill');
		$(e.trigger).children().addClass('bi-check-lg');
		tooltip.show();
		e.trigger.addEventListener('hidden.bs.tooltip', function(e) {
			tooltip.dispose();
			setTimeout(() => {
				$(e.target).children().addClass('bi-clipboard-fill');
				$(e.target).children().removeClass('bi-check-lg');
			}, 2000);
		});
	});
};

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
	const calendarAddUrl = `https://calendar.google.com/calendar?cid=${id}`;
	$('#calendarImportButton').attr('href', calendarAddUrl);
	$('#mobileModalContinueLink').attr('href', calendarAddUrl);
}

$('body').on('click', function (e) {
	//did not click a popover toggle or popover
	if ($(e.target).data('toggle') !== 'popover'
        && $(e.target).parents('.popover.in').length === 0) {
		$('.fc-daygrid-event').popover('hide');
	}
});

$('#calendarImportButton').on('click', function(e) {
	const buttonLoaded = e.currentTarget.href.length > 10;
	if(isMobile() && buttonLoaded) {
		e.preventDefault();
		$('#mobileModal').modal('show');
	}
});

function isMobile() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}

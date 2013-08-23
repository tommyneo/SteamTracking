
CACHE_LIFETIME_SECS = 30;

var g_bLoadingGroupPage = false;
var g_rgPendingRequestedURL = null;
var g_strActiveTab;
var g_strActiveURL;
var g_strGroupURL;
var g_rgPageContentCache = {};
function InitGroupPage( strGroupBaseURL, strActiveTab )
{
	g_strGroupURL = strGroupBaseURL;
	g_strActiveTab = strActiveTab;
	g_strActiveURL = '';
	BindOnHashChange( OnGroupHashChange );
	OnGroupHashChange( window.location.hash, true );
}

function OnGroupHashChange( hash, bInitialLoad )
{
	var strTab = 'overview';
	var url = '';
	if ( hash.length > 1 )
	{
		hash = hash.substr(1);	// skip the #
		var rgMatches = hash.match( /^[^\^]*/ );

		if ( rgMatches && rgMatches[0] )
		{
			url = rgMatches[0];
			url = url.replace( /\.+\//g, '' );	//clean out any ./ or ../ in the URL
			strTab = url.match( /^[a-zA-Z]*/ )[0];
		}
	}

	if ( url != g_strActiveURL )
	{
		if ( bInitialLoad )
		{
			// we just loaded the page and we're immediately navigating to a sub page,
			//	flip over to the dynamic div now so there's no flash of the overview tab/page while
			//	we wait for the AJAX
			$('group_tab_content_overview').hide();
			$('group_page_dynamic_content').show();
			FlipToTab( strTab );
		}
		LoadURL( strTab, url );
	}
	else if ( bInitialLoad )
	{
		// not flipping to another tab, so load trending topics on the group overview page
		LoadTrendingTopics();
	}
}

function LoadURL( strTab, url )
{
	if ( g_bLoadingGroupPage )
	{
		g_rgPendingRequestedURL = {strTab: strTab, url: url };
		return;
	}

	if ( url == '' || url == '/' || url == 'overview' )
	{
		$('group_tab_content_overview').show();
		$('group_page_dynamic_content').hide();
		g_strActiveURL = url;
		FlipToTab( 'overview' );
		return;
	}

	var tsNow = new Date().getTime();
	var rgCacheData = g_rgPageContentCache[ url ];
	if ( !rgCacheData  || ( tsNow - rgCacheData.timestamp > CACHE_LIFETIME_SECS * 1000 ) )
	{
		g_bLoadingGroupPage = true;
		new Ajax.Request( g_strGroupURL + '/' + url, {
			method: 'get',
			parameters: { content_only: true },
			onComplete: OnGroupContentLoadComplete.bind( null, strTab, url )
		} );
	}
	else
	{

		FlipToTab( strTab );
		$('group_page_dynamic_content').childElements().invoke( 'remove' );
		ScrollToIfNotInView( 'group_tab_overview', 20, 150 );

		$('group_page_dynamic_content').appendChild( rgCacheData.html );
		g_strActiveURL = url;
	}
}

function OnGroupContentLoadComplete( strTab, url, transport )
{
	g_bLoadingGroupPage = false;

	FlipToTab( strTab );
	$('group_page_dynamic_content').childElements().invoke( 'remove' );
	ScrollToIfNotInView( 'group_tab_overview', 20, 150 );


	var elContent = new Element( 'div' );
	$('group_page_dynamic_content').appendChild( elContent );
	elContent.update( transport.responseText );

	g_rgPageContentCache[ url ] = {
		timestamp: new Date().getTime(),
		html: elContent
	};

	g_strActiveURL = url;

	if ( g_rgPendingRequestedURL )
	{
		LoadURL( g_rgPendingRequestedURL.strTab, g_rgPendingRequestedURL.url );
		g_rgPendingRequestedURL = null;
	}
}

function FlipToTab( strTab )
{
	$('group_tab_' + g_strActiveTab).removeClassName( 'active' );
	$('group_tab_' + strTab).addClassName( 'active' );

	if ( strTab != 'overview' )
	{
		$('group_tab_content_overview').hide();
		$('group_page_dynamic_content').show();
	}
	else
	{
		LoadTrendingTopics();
	}

	g_strActiveTab = strTab;
}

g_bTrendingTopicsLoading = false;
function LoadTrendingTopics()
{
	var elTrendingTopics = $('group_trending_topics');
	if ( elTrendingTopics.children.length == 0 )
	{
		elTrendingTopics.update('<div id="group_trending_topics_pending"><img src="http://cdn.steamcommunity.com/public/images/login/throbber.gif"></div>')
		g_bTrendingTopicsLoading = true;
		new Ajax.Updater( elTrendingTopics, g_strGroupURL + '/trendingtopics', {method: 'get'} );
	}
}

Event.observe( window, 'load', function() {
	if ( Prototype.Browser.IE )
	{
		var rv = -1;
		var ua = navigator.userAgent;
		var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if (re.exec(ua) != null)
			rv = parseFloat( RegExp.$1 );

		if ( rv < 8 )
		{
			$(document.body).addClassName('nodatauri');
		}
	}
} );



/* Event page cruft */


function deleteEvent( deleteURL )
{
	if ( confirm( 'You are about to delete this event. Are you sure?' ) )
	{
		location.href = deleteURL;
	}
}

function getMonthEvents( newMonth, newYear )
{
	var postData = {
		"xml": 1,
		"action": "eventFeed",
		"month": newMonth,
		"year": newYear
	};
	createQuery2( getEventURL, monthEventsReceive, postData );
}

function getDayEvents( mdy, eventID )
{
	var postData = {
		"xml": 1,
		"action": "eventDayFeed",
		"mdy": mdy
	};
	if ( eventID != undefined )
	{
		postData['selectedEvent'] = eventID;
	}
	createQuery2( getEventURL, dayEventsReceive, postData );
}

var calCurrentClass;
function dayEventsReceive()
{
	if ( req.readyState == 4 )
	{
		if ( req.status == 200 )
		{
			response = req.responseXML.documentElement;
			updateInProgress = false;
			results = response.getElementsByTagName('results')[0].firstChild.nodeValue;
			if ( results != 'OK' )
			{
				alert( results );
				return false;
			}
			// clear existing list
			expandedEvents = document.getElementById( 'eventsExpanded' );
			while( expandedEvents.childNodes.length > 0 )
			{
				expandedEvents.removeChild( expandedEvents.childNodes[0] );
			}
			eventCount = response.getElementsByTagName( 'eventCount' )[0].firstChild.nodeValue;
			expiredEventCount = response.getElementsByTagName( 'expiredEventCount' )[0].firstChild.nodeValue;
			if ( eventCount > 0 || expiredEventCount > 0 )
			{
				mdy = response.getElementsByTagName( 'mdy' )[0].firstChild.nodeValue;
				if ( calCurrentFocus != undefined )
				{
					if ( document.getElementById( 'cal1_' + calCurrentFocus ) )
					{
						document.getElementById( 'cal1_' + calCurrentFocus ).className = calCurrentClass;
						document.getElementById( 'cal1_' + calCurrentFocus ).className = document.getElementById( 'cal1_' + calCurrentFocus ).className.replace( /rollOver/, '' );
						if ( document.getElementById( 'cal1_' + calCurrentFocus ).className == ' ' )
						{
							document.getElementById( 'cal1_' + calCurrentFocus ).classname = '';
						}
					}
				}
				calCurrentClass = document.getElementById( 'cal1_' + mdy ) .className;
				document.getElementById( 'cal1_' + mdy ) .className = 'isFocus';
				calCurrentFocus = mdy;
				selectedEvent = response.getElementsByTagName( 'selectedEvent' )[0].firstChild.nodeValue;
				expandedEvents.innerHTML += '<p class="sectionText" id="fullEventTitle">Showing events for ' + mdy + '</p>';
				if ( eventCount > 0 )
				{
					events = response.getElementsByTagName( 'event' );
					for( x = 0; x < events.length; x++ )
					{
						expandedEvents.innerHTML += events[x].firstChild.nodeValue;
					}
				}
				if ( expiredEventCount > 0 )
				{
					events = response.getElementsByTagName( 'expiredEvent' );
					for( x = 0; x < events.length; x++ )
					{
						expandedEvents.innerHTML += events[x].firstChild.nodeValue;
					}
				}
			}
		}
	}
}



function monthEventsReceive()
{
	if ( req.readyState == 4 )
	{
		if ( req.status == 200 )
		{
			response = req.responseXML.documentElement;
			updateInProgress = false;
			results = response.getElementsByTagName('results')[0].firstChild.nodeValue;
			if ( results != 'OK' )
			{
				alert( results );
				return false;
			}
			// clear existing lists
			eventList = document.getElementById( 'eventListing' );
			while( eventList.childNodes.length > 0 )
			{
				eventList.removeChild( eventList.childNodes[0] );
			}
			expiredEventList = document.getElementById( 'expiredEventListing' );
			while( expiredEventList.childNodes.length > 0 )
			{
				expiredEventList.removeChild( expiredEventList.childNodes[0] );
			}
			expandedEvents = document.getElementById( 'eventsExpanded' );
			while( expandedEvents.childNodes.length > 0 )
			{
				expandedEvents.removeChild( expandedEvents.childNodes[0] );
			}
			//get and populate new ones
			eventCount = response.getElementsByTagName( 'eventCount' )[0].firstChild.nodeValue;
			expiredEventCount = response.getElementsByTagName( 'expiredEventCount' )[0].firstChild.nodeValue;
			monthName = response.getElementsByTagName( 'monthName' )[0].firstChild.nodeValue;
			year = response.getElementsByTagName( 'year' )[0].firstChild.nodeValue;
			bPastMonth = response.getElementsByTagName( 'bPastMonth' )[0].firstChild.nodeValue;
			if ( bPastMonth == 1 )
			{
				document.getElementById( 'futureEventsHeader' ).innerHTML = '';
				document.getElementById( 'futureEventsHeaderBreak' ).style.display = 'none';
			}
			else
			{
				document.getElementById( 'futureEventsHeader' ).innerHTML = monthName + " " + year;
				document.getElementById( 'futureEventsHeaderBreak' ).style.display = 'block';
			}
			if ( expiredEventCount > 0 || bPastMonth == 1 )
			{
				document.getElementById( 'expiredEventsHeader' ).innerHTML = "Past events in " + monthName;
				document.getElementById( 'expiredEventsHeaderBreak' ).style.display = 'block';
			}
			else
			{
				document.getElementById( 'expiredEventsHeader' ).innerHTML = '';
				document.getElementById( 'expiredEventsHeaderBreak' ).style.display = 'none';
			}
			if ( bPastMonth || expiredEventCount > 0 )
			{
				document.getElementById( 'expiredEventsHeader' ).style.display = 'block';
			}
			if ( bPastMonth == 0 )
			{
				document.getElementById( 'futureEventsHeader' ).style.display = 'block';
			}
			if ( eventCount > 0 )
			{
				events = response.getElementsByTagName('event');
				for( x = 0; x < events.length; x++ )
				{
					eventList.innerHTML += events[x].firstChild.nodeValue;
				}
			}
			if ( expiredEventCount > 0 )
			{
				events = response.getElementsByTagName('expiredEvent');
				for( x = 0; x < events.length; x++ )
				{
					expiredEventList.innerHTML += events[x].firstChild.nodeValue;
				}
			}
		}
	}
}


function validateSearchSubmit()
{
	tbox = document.getElementById( 'searchKey' );
	if ( tbox.value == '' )
	{
		return false;
	}
	var elForm = $('searchEditForm');
	window.location = elForm.action + '?' + elForm.serialize();
}

function ConfirmLeaveGroup( groupName )
{
	if ( window.confirm( 'You are about to leave the group: \n' + groupName + '\nAre you sure?' ) )
	{
		$('leave_group_form').submit();
	}
}


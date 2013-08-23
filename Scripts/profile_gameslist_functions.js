var lastFilter = '';
var ScrollSize = 10;
var TotalGames = 0;
var PageStart = 0;
var PageEnd = 0;
var ScrollPage = 0;
var ScrollBusy = false;
var LoadedIDs = [];
var LoadedChangingIDs = [];
var AllLoaded = false;
var ActivationRetries = 0;
var DimButtonList = [];

function AlignMenuCumulative( elemLink, elemPopup, align, valign )
{
	var align = align ? align : 'left';

	if ( !valign )
	{
		//if there's not enough room between our spot and the top of the document, we definitely want to drop down
		if ( document.viewport.getScrollOffsets().top + elemLink.viewportOffset().top < nPopupHeight )
			valign = 'bottom';
		else
		{
			// add a little bit of padding so we don't position it flush to an edge if possible
			var nPopupHeight = elemPopup.getHeight() + 8;
			var nSpaceAbove = elemLink.viewportOffset().top;
			var nSpaceBelow = document.viewport.getHeight() - elemLink.viewportOffset().top;
			//otherwise we only want to drop down if we've got enough space below us (measured based on view area)
			// or if there's not enough space above to pop in either direction and there's more space below
			if ( nSpaceBelow > nPopupHeight || ( nSpaceAbove < nPopupHeight && nSpaceBelow > nSpaceAbove ) )
				valign = 'bottom';
			else
				valign = 'top';

		}
	}

	if ( align == 'left' )
	{
		elemPopup.style.left = ( elemLink.cumulativeOffset()[0] - 12 ) + 'px';
	}
	else if ( align == 'right' )
	{
		elemPopup.style.left = ( elemLink.cumulativeOffset()[0] + elemLink.getWidth() - elemPopup.getWidth() + 13 ) + 'px';
	}
	else if ( align == 'leftsubmenu' )
	{
		elemPopup.style.left = ( elemLink.cumulativeOffset()[0] - elemPopup.getWidth() + 12 ) + 'px';
	}
	else if ( align == 'rightsubmenu' )
	{
		elemPopup.style.left = ( elemLink.cumulativeOffset()[0] + elemLink.getWidth() - 12 ) + 'px';
	}

	if ( valign == 'bottom' )
	{
		elemPopup.style.top = ( elemLink.cumulativeOffset()[1] + elemLink.getHeight() - 12 ) + 'px';
	}
	else if ( valign == 'top' )
	{
		elemPopup.style.top = ( elemLink.cumulativeOffset()[1] - elemPopup.getHeight() + 12 ) + 'px';
	}
	else if ( valign == 'bottomsubmenu' )
	{
		elemPopup.style.top = ( elemLink.cumulativeOffset()[1] - 12 ) + 'px';
	}
}

function ShowMenuCumulative( elemLink, elemPopup, align, valign )
{
	var elemLink = $(elemLink);
	var elemPopup = $(elemPopup);

	AlignMenuCumulative( elemLink, elemPopup, align, valign );

	ShowWithFade( elemPopup );
	Element.addClassName.defer(elemLink,'focus');
	RegisterPopupDismissal( function() { HideWithFade( elemPopup ); elemLink.removeClassName('focus'); }, elemPopup );
}

function filterApps()
{
	if( !AllLoaded )
	{
		rgGames.each(function(game, index) {
			EnsureLoaded(game);
		});
	}
	AllLoaded = true;

	filterString = $('gameFilter').value;
	filterString = filterString.toLowerCase();
	if ( filterString == lastFilter )
		return;
	rgGames.each(function(game, index)
	{
		var appid = game['appid'];
		if ( parseInt( appid ) != appid )
		{
			return;
		}
		lc = game['name'].toString().toLowerCase();
		if ( filterString.length == 0 || lc.indexOf( filterString ) != -1 )
		{
			z = $('game_'+appid);
			if ( z != null )
				$('game_'+appid).style.display = 'block';
		}
		else
		{
			z = $('game_'+appid);
			if ( z != null )
				$('game_'+appid).style.display = 'none';
		}
	});
	lastFilter = filterString;
	ScrollReset();
	ScrollUpdate();
}

function AchievementHover( elem, event, divHover ) 
{
	if (!event) var event = window.event;
    elem = $(elem);
	
	var hover = $(divHover);
	if ( hover.visible() && hover.target == elem )
	{
		return;
	}
	else if ( ( !hover.visible() || hover.target != elem ) )
	{
		var name=elem.getAttribute( 'data-ach-name' );
		var description = elem.getAttribute( 'data-ach-description' );
		hover.down('.content').update( "<h1>" + name + "</h1>" + description );
		ShowAchievementHover( elem, divHover );
	}
}

function HideAchievementHover( elem, event, divHover )
{
	if (!event) var event = window.event;
	var reltarget = (event.relatedTarget) ? event.relatedTarget : event.toElement;
	if ( reltarget && $(reltarget).up( '#' + elem.identify() ) )
	{
		return;
	}
	divHover.hide();
}

function ShowAchievementHover( elem, divHover )
{

	var hover = $(divHover);
	hover.style.visibility = 'hidden';
	hover.show();
	
	hover.clonePosition( elem, {setWidth: false, setHeight: false} );
	var hover_box = hover.down( '.hover_box' );
	var hover_arrow = hover.down( '.hover_arrow' );
	
	if ( Prototype.Browser.IE )
	{
		hover.style.paddingTop = '12px';
		hover_box.style.marginTop = '0px';
	}

	hover.style.left = ( parseInt( hover.style.left ) - 12 ) + 'px';
	hover.style.top = ( parseInt( hover.style.top ) + 33 ) + 'px';

	var boxTopViewport = elem.viewportOffset().top;
	if ( boxTopViewport + hover_box.getHeight() + 8 > document.viewport.getHeight() )
	{
		var nViewportAdjustment = ( hover_box.getHeight() + 8 ) - ( document.viewport.getHeight() - boxTopViewport );
				nViewportAdjustment = Math.min( hover_box.getHeight() - 74, nViewportAdjustment );
		hover.style.top = ( parseInt( hover.style.top ) - nViewportAdjustment ) + 'px';
		
		hover_arrow.style.top = ( 48 + nViewportAdjustment ) + 'px';
	}
	else
	{
		hover_arrow.style.top = '';
	}
	
	hover.style.visibility = '';
	
	hover.target = elem;
}


var gameTemplate = new Template( "<div class=\"gameListRowLogo\">\r\n\t<div class=\"gameLogoHolder_default\">\r\n\t\t<div class=\"gameLogo\">\r\n\t\t\t<a href=\"#{link}\">\r\n\t\t\t\t<img src=\"#{logo}\">\r\n\t\t\t<\/a>\r\n\t\t<\/div>\r\n\t<\/div>\r\n<\/div>\r\n<div class=\"gameListRowItem #{item_background}\">\r\n\t#{achievement_block}\r\n\t#{client_block}\r\n\t<div class=\"gameListRowItemName #{text_color}\">#{name}<\/div>\r\n\t<h5>#{hours_message}<\/h5>\r\n\r\n\t<div class=\"bottom_controls\">\r\n\t\t<div class=\"pullup_item\" onclick=\"ShowMenuCumulative( this, 'links_dropdown_#{appid}', 'right' );\">\r\n\t\t\t<div class=\"menu_ico\">\r\n\t\t\t\t<img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/ico_www.gif\" width=\"16\" height=\"16\" border=\"0\" \/>\r\n\t\t\t<\/div>\r\n\t\t\tLinks\t\t\t<img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/header\/btn_arrow_down.png\" border=\"0\" class=\"menuarrow\" \/>\r\n\t\t<\/div>\r\n\r\n\t\t\t#{stats_button}\r\n\t\t\t<a class=\"pullup_item\" href=\"http:\/\/store.steampowered.com\/recommended\/recommendgame\/#{appid}\">\r\n\t\t\t\t<div class=\"menu_ico\">\r\n\t\t\t\t\t<img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/ico_recommend.gif\" width=\"16\" height=\"16\" border=\"0\" \/>\r\n\t\t\t\t<\/div>\r\n\t\t\t\tRecommend...\t\t\t<\/a>\r\n\t\t<\/div>\r\n\t\t<br clear=\"right\" \/>\r\n\t<\/div>\r\n<\/div>\r\n" );
var changingGameTemplate = new Template( "<div class=\"changingGameListRowLogo\">\r\n\t<div class=\"changingGameLogoHolder\">\r\n        <div class=\"changingGameLogo\">\r\n            <a href=\"#{link}\">\r\n                <img src=\"#{logo}\">\r\n            <\/a>\r\n        <\/div>\r\n    <\/div>\r\n<\/div>\r\n<div class=\"changingGameListRowItem\">\r\n\t<div class=\"gameListRowItemName #{text_color}\">#{name}<\/div>\r\n\t<h5>#{hours_message}<\/h5>\r\n<\/div>\r\n" );
var gameHoursForeverTemplate = new Template ( '#{hours_forever} hrs on record' );
var gameHoursRecentTemplate = new Template ( '#{hours} hrs last two weeks / #{hours_forever} hrs on record' );
var gameStatsTemplate = new Template( "\t<div class=\"pullup_item\" onclick=\"ShowMenuCumulative( this, 'stats_dropdown_#{appid}', 'right' );\">\r\n\t\t<div class=\"menu_ico\"><img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/ico_stats.gif\" width=\"16\" height=\"16\" border=\"0\" \/><\/div>\r\n\t\tView Stats<img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/header\/btn_arrow_down.png\" border=\"0\" class=\"menuarrow\" \/>\r\n\t<\/div>\r\n" );
var gameLinksPopupTemplate = new Template( "\t<div class=\"shadow_ul\"><\/div><div class=\"shadow_top\"><\/div><div class=\"shadow_ur\"><\/div><div class=\"shadow_left\"><\/div><div class=\"shadow_right\"><\/div><div class=\"shadow_bl\"><\/div><div class=\"shadow_bottom\"><\/div><div class=\"shadow_br\"><\/div><div class=\"iepoupfix\"><img class=\"iepoupfix_img\" src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/trans.gif\"><\/div>\r\n\t<div class=\"popup_body2 popup_menu2 shadow_content\">\r\n\t\t<a class=\"popup_menu_item2 tight\" href=\"http:\/\/store.steampowered.com\/app\/#{appid}\">\r\n\t\t\t<h5>Visit the Store Page<\/h5>\r\n\t\t<\/a>\r\n\t\t<a class=\"popup_menu_item2 tight\" href=\"http:\/\/store.steampowered.com\/forum\/#{appid}\">\r\n\t\t\t<h5>Visit the Forums<\/h5>\r\n\t\t<\/a>\r\n\t\t<a class=\"popup_menu_item2 tight\" href=\"http:\/\/steamcommunity.com\/actions\/Search?T=ClanAccount&K=#{name_encoded}\">\r\n\t\t\t<h5>Find Community Groups<\/h5>\r\n\t\t<\/a>\r\n\t\t<a class=\"popup_menu_item2 tight\" href=\"http:\/\/store.steampowered.com\/appofficialsite\/#{appid}\">\r\n\t\t\t<h5>Visit official website<\/h5>\r\n\t\t<\/a>\r\n\t\t<a class=\"popup_menu_item2 tight\" href=\"http:\/\/store.steampowered.com\/news\/?appids=#{appid}\">\r\n\t\t\t<h5>Read related news<\/h5>\r\n\t\t<\/a>\r\n\t<\/div>\r\n" );
var gameStatsPopupTemplate = new Template( "\t<div class=\"shadow_ul\"><\/div><div class=\"shadow_top\"><\/div><div class=\"shadow_ur\"><\/div><div class=\"shadow_left\"><\/div><div class=\"shadow_right\"><\/div><div class=\"shadow_bl\"><\/div><div class=\"shadow_bottom\"><\/div><div class=\"shadow_br\"><\/div><div class=\"iepoupfix\"><img class=\"iepoupfix_img\" src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/trans.gif\"><\/div>\r\n\t<div class=\"popup_body2 popup_menu2 shadow_content\">\r\n\t#{stats_links}\r\n\t<\/div>\r\n" );
var gameAchievementBlockTemplate = new Template( "<div class=\"recentAchievements\">\r\n#{ach_completed} of #{ach_total} Achievements Earned:<br \/>\r\n\t<img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/achieveBarLeft.gif\" width=\"2\" height=\"12\" border=\"0\" \/><img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/achieveBarFull.gif\" width=\"#{ach_bar_width}\" height=\"12\" border=\"0\" \/><img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/achieveBarEmpty.gif\" width=#{ach_bar_width_remainder}\" height=\"12\" border=\"0\" \/><img src=\"http:\/\/cdn.steamcommunity.com\/public\/images\/skin_1\/achieveBarRight.gif\" width=\"2\" height=\"12\" border=\"0\" \/><br \/>\r\n\t#{achievements}\r\n<\/div>\r\n" );
var gameClientBlockTemplate = new Template( "<div class=\"clientConnItemBlock\">\r\n\t#{action_icon}\r\n\t<div class=\"clientConnItemTextBlock\">\r\n\t\t<p class=\"clientConnItemText #{text_color}\">#{status}<\/p>\r\n\t\t<p class=\"clientConnItemText #{text_color}\">#{localContentSize}<\/p>\r\n\t<\/div>\r\n<\/div>\r\n" );
var gameStatsAchievementsTemplate = new Template( '<a class="popup_menu_item2 tight" href="#{profile_link}/stats/#{friendlyURL}/?tab=achievements"><h5>#{persona_name}&#039;s Achievements</h5></a>' );
var gameStatsUserTemplate = new Template( '<a class="popup_menu_item2 tight" href="#{profile_link}/stats/#{friendlyURL}/?tab=stats"><h5>#{persona_name}&#039;s Stats</h5></a>');
var gameStatsLeaderboardTemplate = new Template( '<a class="popup_menu_item2 tight" href="#{profile_link}/stats/#{friendlyURL}/?tab=leaderboards"><h5>#{persona_name}&#039;s Leaderboards</h5></a>' );
var gameStatsGlobalAchievementsTemplate = new Template( '<a class="popup_menu_item2 tight" href="http://steamcommunity.com/stats/#{friendlyURL}/achievements/"><h5>Global Achievements</h5></a>' );
var gameStatsGlobalLeaderboardsTemplate = new Template( '<a class="popup_menu_item2 tight" href="http://steamcommunity.com/stats/#{friendlyURL}/leaderboards/"><h5>Global Leaderboards</h5></a>' );
var gameAchievementItemTemplate = new Template( '<img class="recentAchievementsImg" style="position:relative;" onmouseover="AchievementHover( this, event, $(\'global_hover\') )" onmouseout="HideAchievementHover( this, event, $(\'global_hover\') )" width="32" height="32" border="0" src="#{icon_closed}" data-ach-name="#{ach_name}" data-ach-description="#{ach_description}">');
var gameInfoBarTextTemplate = new Template( '#{items_start} - #{items_end} of #{items_total} items' );

function BuildGameRow( gameInfo )
{
	gameInfo['name_encoded'] = escape( gameInfo['name'] );
	gameInfo['persona_name'] = personaName;
	gameInfo['profile_link'] = profileLink;
	gameInfo['link'] = ( "http://steamcommunity.com/app/" + gameInfo['appid'] );

	// Achievement block, if present.
	if( gameInfo['ach_completion'] && gameInfo['ach_completion']['closed'] > 0 )
	{
		gameInfo['ach_completed'] = gameInfo['ach_completion']['closed'];
		gameInfo['ach_total'] = gameInfo['ach_completion']['total'];
		gameInfo['ach_bar_width'] = 185 * ( gameInfo['ach_completed'] / gameInfo['ach_total'] );
		gameInfo['ach_bar_width_remainder'] = 185 - gameInfo['ach_bar_width'];

		var achievements = '';

		gameInfo['ach_completion']['recent_achievements'].each(function( achievement, index ) {
			achievements += gameAchievementItemTemplate.evaluate( achievement );
		});
		gameInfo['achievements'] = achievements;
		gameInfo['achievement_block'] = gameAchievementBlockTemplate.evaluate( gameInfo );
	}

    if ( gameInfo['client_summary'] )
    {
		UpdateGameInfoFromSummary( gameInfo, gameInfo['client_summary'] );
    }

	// Handle stats links
	var statsLinks = '';

	if( gameInfo['availStatLinks'] )
	{
		if( gameInfo['availStatLinks']['achievements'] )
			statsLinks += gameStatsAchievementsTemplate.evaluate( gameInfo );

		if( gameInfo['availStatLinks']['stats'] )
			statsLinks += gameStatsUserTemplate.evaluate( gameInfo );

		if( gameInfo['availStatLinks']['leaderboards'] )
			statsLinks += gameStatsLeaderboardTemplate.evaluate( gameInfo );

		if( gameInfo['availStatLinks']['global_achievements'] )
			statsLinks += gameStatsGlobalAchievementsTemplate.evaluate( gameInfo );

		if( gameInfo['availStatLinks']['global_leaderboards'] )
			statsLinks += gameStatsGlobalLeaderboardsTemplate.evaluate( gameInfo );

		if( tab == 'recent' || tab == 'all')
		{
			if( tab == 'recent' && gameInfo['hours'] && gameInfo['hours_forever'])
			{
				gameInfo['hours_message'] = gameHoursRecentTemplate.evaluate( gameInfo );
			}
			else if( gameInfo['hours_forever'] )
			{
				gameInfo['hours_message'] = gameHoursForeverTemplate.evaluate( gameInfo );
			}
		}
	}

	var linkspopup = gameLinksPopupTemplate.evaluate( gameInfo );

	var div = new Element('div', {'class': 'popup_block2', id: 'links_dropdown_' + gameInfo['appid'] } );
	div.innerHTML = linkspopup;
	div.hide();
	$('body_base').appendChild(div);

	if( statsLinks )
	{
		gameInfo['stats_links'] = statsLinks;
		gameInfo['stats_button'] = gameStatsTemplate.evaluate(gameInfo);

		var e = new Element('div', {'class': "popup_block2", 'id': "stats_dropdown_" + gameInfo['appid']} );
		e.update( gameStatsPopupTemplate.evaluate( gameInfo ) );
		e.hide();
		$('body_base').appendChild(e);
	}

	var html = gameTemplate.evaluate( gameInfo );

	var div = new Element('div', {'class': 'gameListRow', id: 'game_' + gameInfo['appid'] } );
	div.innerHTML = html;
	$('games_list_rows').appendChild(div);
}

function BuildChangingGameRow( gameInfo )
{
	gameInfo['link'] = ( "http://steamcommunity.com/app/" + gameInfo['appid'] );
	gameInfo['communityLink'] = "http://steamcommunity.com/app/" + gameInfo['appid'];
    gameInfo['hours_message'] = gameHoursForeverTemplate.evaluate( gameInfo );

    var html = changingGameTemplate.evaluate( gameInfo );
    var div = new Element('div', {'class': 'changingGameListRow' });
    div.innerHTML = html;
    $('clientConnChangingGames').appendChild(div);
}

function GetClientActionIcon( summary, appid )
{
	var actionIcon;
	var actionApi;
	var actionParams = { 'sessionid': sessionID, 'appid': appid };
    var actionIconOnClick = '';
    var clickSuccFunc = 'RequestChangingGames()';
    var wrapSuccFunc;

    if (summary['state'] == 'uninstalled')
    {
		actionIcon = 'InstallDefault';
		actionApi = 'install';
		// We delay a bit before fetching state to give
		// the install time to start and be reflected
		// in the client state.  We also force extra
        // queries to occur in case the install takes a
        // long time to start.
		clickSuccFunc = 'DelayRequestChangingGames(1000, 10)';
    }
    else if (summary['state'] == 'installed')
	{
		if (offerClientUninstall)
		{
			actionIcon = 'Uninstall';
			actionApi = 'uninstall';
			// Uninstall is more of an atomic action that doesn't have a lot of
			// intermediate status updates so just wait a while and then refresh.
			clickSuccFunc = 'DelayRefreshPage(3000)';
			wrapSuccFunc = 'ShowConfirmPopup(event, this.parentNode.parentNode, function () { ';
		}
	}
	else if (summary['state'] == 'downloading')
	{
		actionIcon = 'InstallPause';
		actionApi = 'pause';
	}
	else if (summary['state'] == 'paused')
	{
		actionIcon = 'InstallResume';
		actionApi = 'resume';
	}
	else if (summary['state'] == 'no_space')
	{
		actionIcon = 'InstallUnavailable';
	}
	else if (summary['state'] == 'invalid_platform' || summary['state'] == 'no_remote')
	{
	}
	if (actionIcon)
	{
		actionIcon = 'http://cdn.steamcommunity.com/public/images/remote/Icon_Remote' + actionIcon + '.png';
		actionParams['operation'] = actionApi;

		if (actionApi)
		{
			onClickFunc = 'DoXmlRequest(event, \'http://steamcommunity.com/remoteactions/modifyappstate\', \'' +
				$H(actionParams).toQueryString() + '\', function () { ' + clickSuccFunc + '; }, ShowClientError);';
			if (wrapSuccFunc)
			{
				actionIconOnClick = ' onClick="DimButton(this, event, function() { ' + wrapSuccFunc + onClickFunc + ' } ); } );"';
			}
			else
			{
				actionIconOnClick = ' onClick="DimButton(this, event, function() { ' + onClickFunc + ' } );"';
			}
		}
		
		return '<img class="clientConnItemIcon" src="' + actionIcon + '"' + actionIconOnClick + '/>';
	}
	
	return '';
}

function UpdateGameInfoFromSummary( gameInfo, summary )
{
	// Uninstalled apps don't have their state set to save data for a common case.
	// Recreate it here.
	if ( !summary['state'] )
	{
		summary['state'] = 'uninstalled';
		summary['status'] = 'Not installed';
	}
	
	gameInfo['text_color'] = '';
	gameInfo['item_background'] = '';
	
	if ( summary['state'] == 'uninstalled' )
	{
        // Apps which have finished uninstalling recently are still colored
        // active since it's likely the user wants to know when the
        // uninstall completed.
        if ( summary.hasOwnProperty( 'changing' ) )
        {
            gameInfo['item_background'] = 'gameListItemActive';
        }
        else
		{
            gameInfo['item_background'] = '';
        }
		gameInfo['text_color'] = 'color_uninstalled';
	}
	else if ( summary['state'] == 'invalid_platform' || summary['state'] == 'no_remote' )
	{
		gameInfo['text_color'] = 'color_disabled';
	}
	else if ( summary['state'] == 'downloading' || summary['state'] == 'paused' )
	{
		gameInfo['item_background'] = 'gameListItemActive';
	}
	else if ( summary['state'] == 'installed')
	{
		// Apps which have finished installing recently are still colored
		// active since it's likely the user wants to know when the
		// install completed.
		if ( summary.hasOwnProperty( 'changing' ) )
		{
			gameInfo['item_background'] = 'gameListItemActive';
		}
		else
		{
			gameInfo['item_background'] = 'gameListItemInstalled';
		}
	}
	
	gameInfo['status'] = summary['status'];
	gameInfo['localContentSize'] = summary['localContentSize'];

	gameInfo['action_icon'] = GetClientActionIcon( summary, gameInfo['appid'] );

	gameInfo['client_block'] = gameClientBlockTemplate.evaluate( gameInfo );
}

function IsGameActive( div )
{
	var divItem = div.down('.gameListRowItem');
	if ( divItem && divItem.hasClassName('gameListItemActive') )
	{
		return true;
	}
	
	return false;
}

function InsertActiveGameRow( div, divName )
{
	var allRows = $('games_list_rows');
	
	var nextChild = allRows.firstDescendant();
	if (!nextChild)
	{
		allRows.appendChild(div);
		return;
	}

	var nameLower = divName.toLowerCase();
	
	while (IsGameActive(nextChild))
	{
		var childName = nextChild.down('.gameListRowItemName').innerHTML.toLowerCase();
		if (childName >= nameLower)
		{
			break;
		}
		
		nextChild = nextChild.next();
	}
	
	allRows.insertBefore(div, nextChild);
}

function UpdateGameRow( gameInfo, summary )
{
    UpdateGameInfoFromSummary( gameInfo, summary );

	var div = $('game_' + gameInfo['appid']);
	var wasActive = IsGameActive(div);

	var html = gameTemplate.evaluate( gameInfo );
	div.update(html);

	// If an item has just become active we pin it to the top of the list.
    // We also reset the scroll and clear any active filter so that the user can see the
    // newly placed item.
	if ( !wasActive && IsGameActive(div) )
	{
		div.remove();
        $('gameFilter').value = '';
        filterApps();
        InsertActiveGameRow(div, gameInfo['name']);
        ScrollReset();
		ScrollSetHash();
        // The activation we were waiting for has arrived.
        ActivationRetries = 0;
	}
}

function ScrollReset()
{
	$('games_list_rows').setStyle({
		'top': 0
	});
	ScrollPage = 0;
	ScrollUpdate();
}

function ScrollInitialize()
{
	ScrollSize = GetDefaultScrollSize();
	ScrollChangeSize( false, ScrollSize );

	$('10_pp').onclick = function() { ScrollChangeSize( $('10_pp'), 10 ); ScrollSetHash(); };
	$('25_pp').onclick = function() { ScrollChangeSize( $('25_pp'), 25 ); ScrollSetHash(); };
	$('50_pp').onclick = function() { ScrollChangeSize( $('50_pp'), 50 ); ScrollSetHash(); };
	$('all_pp').onclick = function() { ScrollChangeSize( $('all_pp'), TotalGames ) };

    rgChangingGames.each(function(game, index) {
        EnsureChangingLoaded(game);
    });

	var hash = window.location.hash.substr(1).split('|');
	page = parseInt( hash[0] );
	if( page > 0 )
	{
		// We  meed to load all element before the ones we want to show or the order goes wonky
		// TODO: Might be good to just detect this case and insert them in the correct order
		var displayElements = rgGames.slice( 0, page * ScrollSize + ScrollSize ); // Load one scroll in advance.

		displayElements.each(function(game, index) {
			EnsureLoaded(game);
		});

		$('games_list_rows').setStyle( { 'top': ( page * ScrollSize * -92 ) + "px" } );
		ScrollPage = page;
		ScrollUpdate();
	}

}

function ScrollChangeSize( element, newSize )
{
	ScrollSize = newSize;
	SetDefaultScrollSize( newSize );

	$('games_list_row_container').style.maxHeight = (ScrollSize * 92 - 10) + "px";
	$('games_list_row_container').style.overflow = 'hidden';
	ScrollReset();


	$$('.page_size_link').each( function( e, index ) {
		e.removeClassName( 'active' );
	});

	eName = ( TotalGames == newSize ) ? 'all' : newSize;

	if( !element )
		element = $( eName + '_pp' );

	if( element )
		element.addClassName( 'active' );


	$$('.scroll_count').each( function( e, index ) {
		e.update( newSize );
	});

}

function ScrollDown()
{
	if( ScrollPage * ScrollSize + ScrollSize > TotalGames || ScrollBusy )
		return;

	ScrollPage++;
	ScrollBusy = true;

	new Effect.Move( $('games_list_rows'), {y: (ScrollSize * -92), afterFinish: ScrollAnimationFinish } );
}

function ScrollUp()
{
	if( ScrollPage == 0 || ScrollBusy )
		return;

	ScrollPage--;
	ScrollBusy = true;

	new Effect.Move( $('games_list_rows'), {y: (ScrollSize * 92), afterFinish: ScrollAnimationFinish } );
}

function ScrollAnimationFinish()
{
	ScrollBusy = false;
	ScrollSetHash();
	ScrollUpdate();

}

function ScrollSetHash()
{
	window.location.hash = "#"+ScrollPage+"|"+ScrollSize;
}

function ScrollUpdate()
{
	if( ScrollSize == 0 )
		ScrollSize = GetDefaultScrollSize();

	if( AllLoaded )
		TotalGames = $('games_list_rows').childElements().select(function(e) { return e.visible(); }).length;
	else
		TotalGames = rgGames.length;

	PageStart = ScrollPage * ScrollSize;
	PageEnd = ( PageStart + ScrollSize > TotalGames ) ? TotalGames : PageStart + ScrollSize;

	var displayElements = rgGames.slice( PageStart, PageEnd + ScrollSize ); // Load one scroll in advance.

	displayElements.each(function(game, index) {
		EnsureLoaded(game);
	});

	var data = {
		'items_start':	PageStart + 1,
		'items_end':	PageEnd,
		'items_total':	TotalGames
	};

	$$('.scroll_info').each( function( element, id ) {
		element.update( gameInfoBarTextTemplate.evaluate( data ) );
	});

	if( ScrollPage == 0 )
		$$('.scroll_up_button').each( function( element, id ) {
			element.hide();
		});
	else
		$$('.scroll_up_button').each( function( element, id ) {
			element.show();
		});

	if( ScrollPage * ScrollSize + ScrollSize >= TotalGames )
		$$('.scroll_down_button').each( function( element, id ) {
			element.hide();
		});
	else
		$$('.scroll_down_button').each( function( element, id ) {
			element.show();
		});
}

function GetDefaultScrollSize()
{
	var hash = window.location.hash.substr(1).split('|');
	size = parseInt( hash[1] );
	if( size > 0 )
		return size;

	var cookies = document.cookie.split(";");
	for( var i = 0; i < cookies.length; i++ )
	{
		var key = cookies[i].substr( 0, cookies[i].indexOf( "=" ) );
		var value = cookies[i].substr( cookies[i].indexOf( "=" ) + 1 );
		key = key.replace( /^\s+|\s+$/g, "" );

		if( key == "community_game_list_scroll_size" )
		{
			if( value == 'all' )
				return TotalGames;
			value = parseInt( value );
			if( value < 10 )
				return 10
			return value;
		}
	}
	return 10;
}

function EnsureLoaded( app )
{
	//console.log("checking app " + app['appid']);

	if( LoadedIDs.indexOf( app['appid'] ) == -1 )
	{
		//console.log("Loading dirty app " + app['appid']);
		BuildGameRow( app );
		LoadedIDs.push( app['appid'] );
	}
}

function EnsureChangingLoaded( app )
{
    //console.log("checking changing " + app['appid']);

    if( LoadedChangingIDs.indexOf( app['appid'] ) == -1 )
    {
        //console.log("Loading dirty changing " + app['appid']);
        BuildChangingGameRow( app );
        LoadedChangingIDs.push( app['appid'] );
    }
}

function SetDefaultScrollSize( newSize )
{
	if( newSize == TotalGames )
		newSize = 'all';

	var expirationDate = new Date();
	expirationDate.setDate( expirationDate.getDate() + 365 );
	var cookieValue = escape( newSize ) + "; expires=" + expirationDate.toUTCString() + "; path=/";
	document.cookie = "community_game_list_scroll_size=" + cookieValue;
}

function UpdateChangingGames( updates )
{
	if ( !updates.hasOwnProperty( 'summaries' ) )
	{
		return;
	}

	var summaries = updates['summaries'];

    rgGames.each(function(game, index) {
        if ( summaries.hasOwnProperty( game['appid'] ) )
        {
            //console.log('Updating changing app ' + game['appid']);

            EnsureLoaded( game );
            UpdateGameRow( game, summaries[game['appid']] );
        }
    });
}

function RequestChangingGames()
{
	// We aren't actually requesting XML but the xml=1 suppresses the
	// timing information that is appended to pages and which would
	// mess up our HTML block that we're substituting in.
	new Ajax.Updater({ success: 'clientConnBlock' }, profileLink + '/getchanging', {
		parameters: 'xml=1',
		evalScripts: true
		});
}

function DelayRequestChangingGames( delay, retries )
{
	if ( delay === undefined )
	{
		delay = 1000;
	}
    if ( retries !== undefined )
    {
        ActivationRetries = retries;
    }
	
	window.setTimeout( RequestChangingGames, delay );
}

function CheckRequestChangingGames()
{
    if (ActivationRetries < 1)
    {
        return;
    }

    ActivationRetries--;
    DelayRequestChangingGames(1000);
}

function RefreshPage()
{
	location.reload(true);
}

function DelayRefreshPage( delay )
{
    if ( delay === undefined )
    {
        delay = 5000;
    }

    window.setTimeout( RefreshPage, delay );
}

function ShowClientError( jqXHR, textStatus, errorThrown )
{
    RestoreDimButtons();

    var errorElt = document.getElementById( 'clientError' );
    if ( !errorElt || errorElt.style.display !== 'none' )
    {
        return;
    }

    errorElt.style.display = 'block';
}

function ConfirmCancel( event )
{
    RestoreDimButtons();
    ToggleElementHidden('uninstallConfirm', 'block', event);
}

function ShowConfirmPopup( event, targetElt, onClick )
{
    if ( event )
    {
        if ( event.stopPropagation )
        {
            event.stopPropagation();
        }
        event.cancelBubble = true;
    }

    var confirmElt = document.getElementById( 'uninstallConfirm' );
    if ( !confirmElt )
    {
		console.log( 'uninstallConfirm element is missing' );
        RestoreDimButtons();
        return;
    }

    confirmElt.setStyle({display: 'block'});
	confirmElt.clonePosition($(targetElt));

    var yesElt = document.getElementById( 'uninstallConfirmYes' );
    if (yesElt)
    {
        yesElt.onclick = function () { ToggleElementHidden( 'uninstallConfirm', 'block' ); onClick(); };
    }
}

function DoXmlRequest( event, subURL, postData, succFunc, errorFunc )
{
    if ( event.stopPropagation )
    {
        event.stopPropagation();
    }
    event.cancelBubble = true;

    new Ajax.Request(subURL, {
        method: 'post',
        parameters: postData,
        onSuccess: function( xhr )
        {
			var data = xhr.responseJSON;
            var success = false;
            if ( data && 'success' in data )
            {
                success = data.success;
                if ( success && succFunc )
                {
                    succFunc( );
                }
            }
        },
        onFailure: function( xhr, data )
        {
            if ( errorFunc )
            {
                errorFunc( xhr );
            }
        },
    });
}

function ToggleElementHidden( element, showType, event, iconElement, iconShowUrl, iconHideUrl )
{
    if ( event )
    {
        if ( event.stopPropagation )
        {
            event.stopPropagation();
        }
        event.cancelBubble = true;
    }

    var elt = document.getElementById( element );
    if ( elt )
    {
        var icon;

        if ( iconElement )
        {
            icon = document.getElementById( iconElement );
        }

        if ( elt.style.display == 'none' )
        {
            elt.style.display = showType;
            if ( icon )
            {
                icon.src = iconShowUrl;
            }
        }
        else
        {
            elt.style.display = 'none';
            if ( icon )
            {
                icon.src = iconHideUrl;
            }
        }
    }
}

function RestoreDimButtons()
{
    for (var i = 0; i < DimButtonList.length; i++)
    {
        $(DimButtonList[i]).setOpacity(1);
    }
    DimButtonList = [];
}

function DimButton( button, event, afterFunc )
{
    if ( event )
    {
        if ( event.stopPropagation )
        {
            event.stopPropagation();
        }
        event.cancelBubble = true;
    }

    // If the button has already been clicked we ignore another click.
    if ($(button).getOpacity() < 0.95)
    {
        return;
    }

    if ( DimButtonList.indexOf(button) < 0 )
    {
        DimButtonList.push(button);
    }

    $(button).setOpacity(0.25);
    afterFunc.call(button);
}


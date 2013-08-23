// <script type="text/javascript">
// programmatic name of language the user is editing
var g_language = '';

// list of programmatic names of languages the user has indicated the app supports
var g_rgEditingLanguages = {'token': 1};

// is there more than one editing language?
var g_bLocalized = false;

//
// Common client side request handler for apps AJAX calls. This routine
// exists to encapsulate the MIME type checking, GET/POST method, results
// cracking (as far as it goes), etc.
//
function AppsAjaxRequest( requestUrl, hashParms, successClosure, requestMethod )
{
	if ( requestMethod == null ) requestMethod = 'get';
	new Ajax.Request( requestUrl,
		{
			requestHeaders: { 'Accept': 'application/json' },
			method: requestMethod,
			parameters: hashParms,
			onSuccess: function( transport )
			{
				var results = transport.responseJSON;
				if ( results )
				{
					successClosure( results );
				}
			}
		} );
}


//
// many of our AJAX actions send back JSON with two items in it:
// - message: text to put into an element
// - success: whether it succeeded
// this callback writes the text into the specified element, and applies
// a CSS class based on the success code.  Additionally it will display a
// message indicating that a publish is required to commit changes.
//
function StandardCallback( results, elementName )
{
	elt = $(elementName);
	
	// check type of elt
	if ( typeof( elt ) == "object" )
	{
		elt.innerHTML = '';
		var message = [];
		// see if we have a multiline result or a single piece of text
		if ( typeof ( results[ 'message' ] ) == "string" )
		{
			message[0] = [ results[ 'message' ] ];
		}
		else
		{
			message = results[ 'message' ];
		}
		
		for ( i = 0; i < message.length; i++ )
		{
			// poke in results
			eltSpan = document.createElement( 'span' );
			eltSpan.innerHTML = message[ i ];
			elt.appendChild( eltSpan );
			elt.appendChild( document.createElement( 'br' ) );
		}

		// set style based on returned success code
		elt.className = results[ 'success' ] ? "outputSuccess" : "outputFailure";

		ShowUnpublishedChangesWarningIfNeeded();
		
		return true;
	}
	else
	{
		return false;
	}
}

// similar callback, only it just refreshes the whole page on completion no matter what
function RefreshCallback( results )
{
	window.location.reload( true );
}

function ShowUnpublishedChangesWarningIfNeeded()
{
	var elNeedsPublish = $('needs_publishing_msg')
	if ( elNeedsPublish && !elNeedsPublish.visible() )
	{
		AppsAjaxRequest( g_szBaseURL + "/apps/diff/" + g_AppId,
				{},
				function( results )
				{
					if ( results[ 'opened' ] )
					{
						elNeedsPublish.show();
					}
				}
			);
	}
}


//
// Common output setter for some of the app management calls.
// Pretty thin wrapper around StandardCallback.
//
function CommonSetHandler( results )
{
	StandardCallback( results, 'infoOutput' );
}


//
// Set the app's 'released' state, which affects visibility to non-owners
// for playtime, community, etc.
//
function SetAppReleaseState( appid, checkState )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setreleased/' + appid,
		{ 'released' : Boolean( checkState ) },
		CommonSetHandler
		);
}


//
// Set the app's marketing data locked state, which can prevent users
// from modifying certain game metadata that should not be adjusted
// after we have approved and applied it
//
function SetAppMktgLockedState( appid, checkState )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setmktglocked/' + appid,
		{ 'mktglocked' : Boolean( checkState ) },
		CommonSetHandler
		);
}


//
// Set whether the lobby APIs should be enabled for this game
//
function SetAppUsesLobbies( appid, lobbyState )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setuseslobbies/' + appid,
		{ 'useslobbies' : lobbyState },
		CommonSetHandler
		);
}


//
// Set whether the frenemy matchmaking ( friend blocking ) should be enabled for this game
//
function SetAppUsesFrenemies( appid, frenemyState )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setusesfrenemies/' + appid,
		{ 'usesfrenemies' : frenemyState },
		CommonSetHandler
		);
}

//
// Set the signing info
//
function SetAppSigningInfo( appid, fileKeyMap, signaturesCheckedOnLaunch )
{	
    AppsAjaxRequest( g_szBaseURL + '/apps/setsigninginfo/' + appid,
		{ 'filekeymap': fileKeyMap, 'signaturescheckedonlaunch': signaturesCheckedOnLaunch },
		function( results )
		{
			$('signinginfo_display').innerHTML = "Saved.";
			// now reflect results
			CommonSetHandler( results );
		}
		);		
}

//
// Set the economy info
//
function SetAppEconomyInfo( appid, assetURL, assetKey, apiLevel, assetClassVersion, privateMode )
{
    AppsAjaxRequest( g_szBaseURL + '/apps/seteconomyinfo/' + appid,
		{ 'assetURL' : assetURL, 'assetKey' : assetKey, 'apiLevel' : apiLevel, 'assetClassVersion': assetClassVersion, 'privateMode' : privateMode },
		function( results )
		{
			// now reflect results
			CommonSetHandler( results );
		},
		"POST"
		);
}

//
// Set the workshop info
//
function SetAppWorkshopInfo( appid, hashParams )
{
    AppsAjaxRequest( g_szBaseURL + '/apps/setworkshopinfo/' + appid, hashParams,
		function( results )
		{
			// now reflect results
			CommonSetHandler( results );
		},
		"POST"
		);
}

// handler for requesting keys
function SetRequestKeys( appid, requests )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/requestkeys/' + appid,
		{
			'keys': Object.toJSON( requests )
		},
		function( results )
		{
			if ( results[ 'success' ] )
			{
				// no error, reload page
				$('AjaxOutput').innerHTML = "Reloading...";
				RefreshCallback( results );
			}
			else
			{
				$('AjaxOutput').innerHTML = "<span style='color:red'>" + results.message + "</span>";
			}
		},
		'POST'
		);

}

// handler for requesting keys
function ApproveKeys( requests )
{
	AppsAjaxRequest( g_szBaseURL + '/cdkeys/approvekeys/',
		{
			'approvals': Object.toJSON( requests )
		},
		function( results )
		{
			RefreshCallback( results );
		},
		'POST'
		);

}

function EconomyInventoryLogoUploadCallback( appid, jsonResponse )
{
	var results = jsonResponse.evalJSON( true );

	StandardCallback( results, 'inventory_logo_upload_response' );

	// poke the image in there
	if ( 'images' in results )
	{
		if ( 'economy_inventory_logo' in results.images )
		{
			var url = unescape( results.images.economy_inventory_logo );
			$( 'inventory_logo' ).src = url;
		}
	}
}

//
// handler for selecting an app in the app list.
// redirects the browser to the location for the particular appid
// 
function AppSelect( controller, method )
{
	if ( controller == "" || controller == undefined )
	{
		method = "apps";
	}
	if ( method == "" || method == undefined )
	{
		method = "view";
	}
	var appSelect = $('appSelect');
	var newID = appSelect.options[ appSelect.selectedIndex ].value;
	
	if ( newID == "-1" ) return;

	var newLocation = g_szBaseURL + '/' + controller + '/' + method + '/' + newID;
	window.location = newLocation;
}


//
// handler for changing builds within error info
//
function BuildSelect( appid )
{
	var buildSelect = $( 'buildSelect' );
	var newBuild    = buildSelect.options[ buildSelect.selectedIndex ].value;

	window.location = g_szBaseURL + '/errors/viewbuild/' + appid + '/' + newBuild;  
}


// 
// ajax requestor to ping the cser and ask it to load more minidumps for the given error
//
function RequestTenMoreMinidumps( errorid )
{
	$('requestOutput').innerHTML = '';
	AppsAjaxRequest( g_szBaseURL + '/errors/moreminidumps/' + errorid,
		{
		},
		function( results )
		{
			StandardCallback( results, 'requestOutput' );
		}
		);
}



//
// onchange handler, fixes up the anchor in the "go publish target app"
// link when user selects a new target app.
//
function MigrateTargetFixup( migrateSelect )
{

	if ( migrateSelect == null )
	{
		return;
	}
		
	var victimID = migrateSelect.options[ migrateSelect.selectedIndex ].value;
	
	if ( victimID > 0 )
	{
		$('publish_anchor').href = g_szBaseURL + "/apps/publishing/" + victimID;
	} 
}


function AppMigrate( appidSrc, bForce, bMergeLite, selector )
{
	var appidDest = selector.options[ selector.selectedIndex ].value;
	
	if ( appidDest == -1 )
	{
		alert( "Please select a game first." );
		return;
	}

	AppsAjaxRequest( g_szBaseURL + '/apps/migrate/' + appidSrc + '/' + appidDest ,
		{
			'force': bForce,
			'lite': bMergeLite
		},
		function( results )
		{
			StandardCallback( results, 'migrateOutput' );
		}
		);
}


function PerformNewAchievement( appid )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/newachievement/' + appid,
		{
			'maxstatid' : $('max_statid_used').innerHTML,
			'maxbitid' : $('max_bitid_used').innerHTML
		},
		function( results )
		{
			$('max_statid_used').innerHTML = results[ 'maxstatid' ];
			$('max_bitid_used').innerHTML = results[ 'maxbitid' ];
			NewAchievement( appid, results[ 'achievement' ] );
			var id = EditAchievement( appid, results[ 'achievement' ] );
			location.hash = id + "_edit";
		}
		);
}


function PerformNewStat( appid )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/newstat/' + appid,
		{
			'maxstatid' : $('max_statid_used').innerHTML
		},
		function( results )
		{
			$('max_statid_used').innerHTML = results[ 'maxstatid' ];
			NewStat( appid, results[ 'stat' ] );
			var id = EditStat( appid, results[ 'stat' ] );
			location.hash = id + "_edit";
		}
		);
}


function EditAchievementClosure( appid, statid, bitid )
{
	theClosure = function()
		{
		AppsAjaxRequest( g_szBaseURL + "/apps/fetchachievement/" + appid + "/" + statid + "/" + bitid,
			{},
			function( results )
			{
				EditAchievement( appid, results );
			}
			);
		};

	return theClosure;
}


function EditStatClosure( appid, statid )
{
	theClosure = function()
		{
		AppsAjaxRequest( g_szBaseURL + "/apps/fetchstat/" + appid + "/" + statid,
			{},
			function( results )
			{
				EditStat( appid, results );
			}
			);
		};

	return theClosure;
}


function IDFromAchievement( statid, bitid )
{
	return "a" + statid + "_" + bitid;
}

function IDFromStat( statid )
{
	return "s" + statid;
}


function DeleteAchievementRow( statid, bitid )
{
	var theRow = $( IDFromAchievement( statid, bitid ) );
	theRow.parentNode.removeChild( theRow );
}

function DeleteStatRow( statid )
{
	var theRow = $( IDFromStat( statid ) );
	theRow.parentNode.removeChild( theRow );
}


function DeleteAchievementClosure( appid, statid, bitid, apiname )
{
	theClosure = function()
		{
		if ( !confirm( "Delete achievement " + apiname + " (" + statid + "/" + bitid + ")?" ) )
		{
			return;
		}
		AppsAjaxRequest( g_szBaseURL + "/apps/deleteachievement/" + appid + "/" + statid + "/" + bitid,
			{},
			function( results )
			{
				if ( results[ 'deleted' ] )
				{
					DeleteAchievementRow( statid, bitid );
				}
			}
			);
		};

	return theClosure;
}


function DeleteStatClosure( appid, statid )
{
	theClosure = function()
		{
		AppsAjaxRequest( g_szBaseURL + "/apps/deletestat/" + appid + "/" + statid,
			{},
			function( results )
			{
				if ( results[ 'deleted' ] )
				{
					DeleteStatRow( statid );
				}
			}
			);
		};

	return theClosure;
}


function RevertAchievementClosure( appid, statid, bitid )
{
	theClosure = function()
		{
		AppsAjaxRequest( g_szBaseURL + "/apps/fetchachievement/" + appid + "/" + statid + "/" + bitid,
			{},
			function( results )
			{
				if ( typeof( results ) == "object" )
				{
					ReplaceAchievement( appid, results );
				}
				else
				{
					DeleteAchievementRow( statid, bitid );
				}
			}
			);
		};

	return theClosure;
}


function RevertStatClosure( appid, statid )
{
	theClosure = function()
		{
		AppsAjaxRequest( g_szBaseURL + "/apps/fetchstat/" + appid + "/" + statid,
			{},
			function( results )
			{
				if ( typeof( results ) == "object" )
				{
					ReplaceStat( appid, results );
				}
				else
				{
					DeleteStatRow( statid );
				}
			}
			);
		};

	return theClosure;
}


function FetchLocalizedForm( elt, key )
{
	var formData = elt.serialize( true );
	if ( key in formData )
	{
		// nonlocalized value; marshal as a single string
		formData = formData[ key ];
	}
	else
	{
		// form has an associative array of language => string.
		// drop languages with empty values so we don't clutter up
		// the KV.
		for ( lang in formData )
		{
			if ( formData[ lang ] == "" )
			{
				delete formData[ lang ];
			}
		}
		
		// now catch the case where there's only an english string
		// in the otherwise localized form, and back the data off
		// to a regular string
		var keysRemaining = Object.keys( formData );
		if ( keysRemaining.length == 1 && keysRemaining[ 0 ] == 'english' ) 
		{
			formData = formData[ 'english' ];
		}
	}
	// either way, marshal as JSON for convenience of the server side code
	return Object.toJSON( formData );
}


function SaveAchievementClosure( appid, statid, bitid )
{
	theClosure = function()
		{
		var id = "ach" + statid + "_" + bitid;

		var displayName = FetchLocalizedForm( $( id + '_displayname' ), 'display_name' );
		var description = FetchLocalizedForm( $( id + '_description' ), 'description' );
		var progressSelect = $( id + '_progress' );
		
		AppsAjaxRequest( g_szBaseURL + "/apps/saveachievement/" + appid,
			{
			'statid' : statid,
			'bitid' : bitid,
			'apiname' : $( id + '_apiname' ).value,
			'displayname' : displayName,
			'description' : description,
			'permission' : $( id + '_permission' ).selectedIndex,
			'hidden' : $( id + '_hidden' ).checked,
			'progressStat' : progressSelect.value,
			'progressMin' : $( id + '_minval' ).value,
			'progressMax' : $( id + '_maxval' ).value
			},
			function( results )
			{
				if ( results[ 'saved' ] )
				{
					ReplaceAchievement( appid, results[ 'achievement' ] );
				}
				// leave it in edit mode otherwise
			},
			'post'
			);
		};

	return theClosure;
}

function SaveStatClosure( appid, statid )
{
	theClosure = function()
		{
		var id = "stat" + statid;
		AppsAjaxRequest( g_szBaseURL + "/apps/savestat/" + appid,
			{
			'statid' : statid,
			'stattype' : $( id + '_stattype' ).value,
			'apiname' : $( id + '_statapiname' ).value,
			'permission' : $( id + '_permission' ).selectedIndex,
			'incrementonly' : $( id + '_incrementonly' ).checked,
			'maxchange' : $( id + '_maxchange' ).value,
			'min' : $( id + '_min' ).value,
			'max' : $( id + '_max' ).value,
			'windowsize' : $( id + '_windowsize' ).value,
			'default' : $( id + '_default' ).value,
			'aggregated' : $( id + '_aggregated' ).checked,
			'displayname' : $( id + '_displayname' ).value
			},
			function( results )
			{
				if ( results[ 'saved' ] )
				{
					ReplaceStat( appid, results[ 'stat' ] );
				}
				// leave it in edit mode otherwise
			},
			'post'
			);
		};

	return theClosure;
}

function BAchievementFieldLocalized( achievement, field )
{
	return typeof( achievement[ field ] ) != "string";
}


function LocalizedAchievementField( achievement, field, fallback, language )
{
	// fallback is used only for loc tokens, as they are required where
	// language strings are not.

	var results = {};
	if ( typeof( achievement[ field ] ) == "string" )
	{
		// non-localized field: treat it as the english field.
		// emit bPresent iff we are asking for english.
		// if we're asking for loc tokens, emit the fallback token.
		// otherwise emit the fallback english string.

		if ( language == "token" )
		{
			results[ 'bPresent' ] = false;
			results[ 'string' ] = fallback;
		}
		else
		{
			results[ 'bPresent' ] = ( language == "english" );
			results[ 'string' ] = achievement[ field ];
		}
	}
	else if ( language in achievement[ field ] )
	{
		// have this language; emit the localized field.
		results[ 'bPresent' ] = true;
		results[ 'string' ] = achievement[ field ][ language ];
	}
	else
	{
		// don't have this language; emit the English string instead,
		// or the fallback string if we're doing loc tokens, or the
		// empty string otherwise.

		results[ 'bPresent' ] = false;
		if ( 'english' in achievement[ field ] )
			results[ 'string' ] = achievement[ field ][ 'english' ];
		else if ( language == 'token' )
			results[ 'string' ] = fallback;
		else
			results[ 'string' ] = '';
	}
	
	return results;
}


function AchievementSpan( achievement, field, fallback, language )
{
	data = LocalizedAchievementField( achievement, field, fallback, language );
	
	var text = "";
	var newSpan = document.createElement( "span" );

	if ( data[ 'bPresent' ] )
	{
		newSpan.innerHTML = data[ 'string' ];
	}
	else
	{
		// don't display "fallback" english text for the loc token
		if ( language != "token" )
		{
			var firstSpan = document.createElement( "span" );
			firstSpan.innerHTML = data[ 'string' ];
			newSpan.appendChild( firstSpan );
		}
		
		var secondSpan = document.createElement( "span" );

		if ( language == "english" )
			secondSpan.innerHTML = " [no English string]";
		else if ( language == "token" )
			secondSpan.innerHTML = "[no localization token]";
		else
			secondSpan.innerHTML = " [fallback English string]";
		secondSpan.className = 'outputNeutral';
		newSpan.appendChild( secondSpan );
	}
		
	return newSpan;
}


//
// pokes a given achievement into a given DOM element for its TR.
//
// assumes the row is empty at entry.
// 
function SetAchievement( appid, destRow, achievement )
{
	destRow.insertCell( -1 ).innerHTML = achievement[ "stat_id" ] + "/" + achievement[ "bit_id" ];
	var nameCell = destRow.insertCell( -1 );
	nameCell.innerHTML = achievement[ "api_name" ];
	nameCell.appendChild( document.createElement( "br" ) );
	
	// Add the achievement progress stat line
	if ( typeof achievement[ 'progress' ] === 'object' )
	{
		// currently only support direct stat value mapping
		progressSpan = document.createElement( 'span' );
		progressSpan.innerHTML = achievement.progress.value.operand1 + ' (' + achievement.progress.min_val + '-' + achievement.progress.max_val + ')';
		
		nameCell.appendChild( progressSpan );
		nameCell.appendChild( document.createElement( "br" ) );
	}

	// TODO MRHOTEN need to do the below shenanigans for the display name as well.
	// obviously some kind of helper would be handy here. maybe it could just
	// return the span DOM object instead of going through the parser.
	var descCell = destRow.insertCell( -1 );
	
	var rgLanguageDisplay = g_rgLanguages;
	
	var bPrefix = false;
	var languages;
	if ( g_language == "all" )
	{
		languages = g_rgEditingLanguages;
		bPrefix = true;
	}
	else
	{
		languages = {};
		languages[ g_language ] = 1;
	}

	for ( language in languages )
	{
		if ( bPrefix )
		{
			var prefixSpan = document.createElement( "span" );
			prefixSpan.innerHTML = "[" + rgLanguageDisplay[ language ] + "] ";
			descCell.appendChild( prefixSpan );
		}
		descCell.appendChild( AchievementSpan( achievement, "display_name", achievement.api_name + '_NAME', language ) );
		descCell.appendChild( document.createElement( "br" ) );
	}
	
	// TODO mrhoten Commonify description and display name
	for ( language in languages )
	{
		if ( bPrefix )
		{
			var prefixSpan = document.createElement( "span" );
			prefixSpan.innerHTML = "[" + rgLanguageDisplay[ language ] + "] ";
			descCell.appendChild( prefixSpan );
		}
		descCell.appendChild( AchievementSpan( achievement, "description", achievement.api_name + '_DESC', language ) );
		descCell.appendChild( document.createElement( "br" ) );
	}
	
	switch ( achievement[ "permission" ] )
	{
	case "1": destRow.insertCell( -1 ).innerHTML = "GS"; break;
	case "2": destRow.insertCell( -1 ).innerHTML = "Official GS"; break;

	case "0": 
	default: 
		destRow.insertCell( -1 ).innerHTML = "Client";
	}
	
	destRow.insertCell( -1 ).innerHTML = ( achievement[ "hidden" ] != 0 ) ? "<b>Yes</b>" : "";

	var newImg = document.createElement( "img" );
	newImg.src = achievement[ "icon" ];
	newImg.height = 64;
	newImg.width = 64;
	destRow.insertCell( -1 ).appendChild( newImg );

	newImg = document.createElement( "img" );
	newImg.src = achievement[ "icon_gray" ];
	newImg.height = 64;
	newImg.width = 64;
	destRow.insertCell( -1 ).appendChild( newImg );

	var btnCell = destRow.insertCell( -1 );

	var btn = document.createElement( "input" );
	btn.type= "submit";
 	btn.onclick = EditAchievementClosure( appid, achievement[ "stat_id" ], achievement[ "bit_id" ] );
	btn.value = "Edit";
	btnCell.appendChild( btn );

	btnCell.appendChild( document.createElement( "br" ) );

	var btn2 = document.createElement( "input" );
	btn2.type = "submit";
 	btn2.onclick = DeleteAchievementClosure( appid, achievement[ "stat_id" ], achievement[ "bit_id" ], achievement[ "api_name" ] );
	btn2.value = "Delete";
	btnCell.appendChild( btn2 );

	delete btn;
	delete btn2;
	delete btnCell;
	delete destRow;
	delete newImg;
	delete achievement;
}


//
// server callback - here's a new stat we need to add
//
// would be nice to commonify this with the SetItemsWorker code path
// 
function NewStat( appid, stat )
{
	var parentDiv = document.getElementById( "appStatDisplay" );
	var sourceDiv = document.getElementById( "statTableSource" );
	theTable = parentDiv.firstChild;

	var newRow = theTable.tBodies[ 0 ].insertRow( -1 );
	newRow.vAlign = "top";

	newRow.id = "s" + stat[ "stat_id" ];

	SetStat( appid, newRow, stat );
}


//
// server callback - here's a new achievement we need to add
//
// would be nice to commonify this with the SetItemsWorker code path
// 
function NewAchievement( appid, achievement )
{
	var parentDiv = document.getElementById( "appAchievementDisplay" );
	var sourceDiv = document.getElementById( "achievementTableSource" );
	theTable = parentDiv.firstChild;

	var newRow = theTable.tBodies[ 0 ].insertRow( -1 );
	newRow.vAlign = "top";

	newRow.id = "a" + achievement[ "stat_id" ] + "_" + achievement[ "bit_id" ];

	SetAchievement( appid, newRow, achievement );
}


// utility/compatibility routine
function ClearRow( theRow )
{
	if ( theRow.style.backgroundColor )
	{
		theRow.style.backgroundColor = "";
		gDirtyRows--;
	}		
		
	var count = theRow.cells.length;

	for ( var i = 0; i < count; i++ )
	{
		theRow.deleteCell( 0 );
	}
}


//
// pokes a given achievement back into the achievements table - used
// for "revert edited achievement" case.
//
function ReplaceAchievement( appid, achievement )
{
	var achievementRow = document.getElementById( "a" + achievement[ "stat_id" ] + "_" + achievement[ "bit_id" ] );
	ReplaceWorker( appid, achievement, achievementRow, SetAchievement );
}


function AchievementEditLocalizeHelper( container, form, achievement, field, fallbackSuffix )
{
	var languages = g_rgLanguages;

	for ( language in languages )
	{
		var subItem = document.createElement( "input" );
		
		if ( ( g_language == "all" && language in g_rgEditingLanguages ) )
		{
			// viewing all languages and this is a lang we're editing; add a prefix
			var subPrefix = document.createElement( "span" );
			subPrefix.innerHTML = "[" + languages[ language ] + "] ";
			form.appendChild( subPrefix );
			subItem.style.width = "100%";
			subItem.size = 30;
		}
		else if ( language == g_language )
		{
			// this is the selected language; it's already an edit control, so we're done
			subItem.style.width = "100%";
			subItem.size = 30;
		}
		else
		{
			// not our language -> hidden form control
			subItem.type = "hidden"; 
		}

		subItem.name = language;
		data = LocalizedAchievementField( achievement, field, achievement.api_name + fallbackSuffix, language );
		if ( data.bPresent || language == "token" )
		{
			subItem.value = data.string;
		}
		
		form.appendChild( subItem ); 
	}
}

//
// Adds an option item to a select
//  Gets around a dom-difference in IE (grr...)
//
function AddOptionToSelect( select, option )
{
	try
	{
		// Standards-compliant
		select.add( option, null );
	}
	catch ( ex )
	{
		// IE non-compliant
		select.add( option );
	}
}


//
// Builds the stat permission drop-down 
//
function CreateStatPermissionSelect( id )
{
	itemSelect = document.createElement( "select" );
	itemSelect.style.width = "auto";
	itemSelect.id = id + "_permission";
	values = new Array( "Client", "GS", "Offical GS" );
	for ( i = 0; i < values.length; i++ )
	{
		var option = document.createElement( "option" );
		option.text = values[i];
		option.value = i;
		AddOptionToSelect( itemSelect, option );
	}
	
	return itemSelect;
}


var gDirtyRows = 0;

function DirtyRowClosure( row )
{
	return function()
	{
		if ( !row.style.backgroundColor )
		{
			row.style.backgroundColor = '#464646';
			gDirtyRows++;
		}
	};
}

function StatsNavigateWarning()
{
	if ( gDirtyRows )
		return "There are unsaved changes on this page."
}


//
// fills in a given row of the achievement table, in edit mode
//
function EditAchievement( appid, achievement )
{
	// TODO MRHOTEN clone a <tr> from the static area of the template to ease the transition here;
	// could set it up templatized (like we do the upload forms) or we could templatize the IDs
	// then access it via $().
	//
	// this will, one hopes, be cleaner than all this DOM munging herein.
	//
	// Was the IE table model brokenness the reason we had to do all this in script? be sure
	// to test this mechanism in IE before going very far with it.
	var achievementRow = document.getElementById( "a" + achievement[ "stat_id" ] + "_" + achievement[ "bit_id" ] );

	if ( typeof( achievementRow ) == "object" )
	{
		var id = "ach" + achievement[ 'stat_id' ] + "_" + achievement[ 'bit_id' ];
		var row = achievementRow; // less typing
		var item;
		var newHash;

		ClearRow( row );

		row.className = "selected";

		var firstCell = row.insertCell( -1 );
		firstCell.innerHTML = achievement[ "stat_id" ] + "/" + achievement[ "bit_id" ];
		item = document.createElement( "a" );
		newHash = id + "_edit";
		item.name = newHash;
		firstCell.appendChild( item );

		item = document.createElement( "input" );
		item.id = id + "_apiname";
		item.style.width = "100%";
		item.size = 30;
		item.value = achievement[ 'api_name' ];
		item.onchange = DirtyRowClosure( row );
		var nameCell = row.insertCell( -1 );
		// ensure nameCell is extended
		Element.extend( nameCell );
		nameCell.appendChild( item );
		
		// achievement progress
		// insert some descriptive text and a select
		nameCell.appendChild( document.createElement( 'br' ) );
		textSpan = document.createElement( "span" );
		textSpan.innerHTML = "Progress stat ";
		nameCell.appendChild( textSpan );
		
		var progressSelect = document.createElement( "select" );
		progressSelect.onchange = DirtyRowClosure( row );
		progressSelect.id = id + "_progress";
		var noProgressOption = document.createElement( "option" );
		noProgressOption.text = "[Loading]";
		noProgressOption.value = "-1";
		AddOptionToSelect( progressSelect, noProgressOption );
		progressSelect.selectedIndex = 0;
		nameCell.appendChild( progressSelect );

		var minVal = 0;
		var maxVal = 0;
		if ( typeof achievement.progress === 'object' )
		{
			minVal = achievement.progress.min_val;
			maxVal = achievement.progress.max_val;
		}
		
		var theInput;
		nameCell.insert( new Element( 'br' ) );
		nameCell.insert( { 'bottom' : 'Min value: ' } );
		theInput = new Element( 'input', { 'size' : '10', 'value' : minVal, 'id' : id + '_minval' } );
		theInput.onchange = DirtyRowClosure( row );
		nameCell.insert( theInput );
		nameCell.insert( { 'bottom' : 'Max: ' } );
		theInput = new Element( 'input', { 'size' : '10', 'value' : maxVal, 'id' : id + '_maxval' } );
		nameCell.insert( theInput );

		// fetch gameplay stats and feed them to a closure to jam them into the progress select
		AppsAjaxRequest(
				g_szBaseURL + '/apps/fetchstats/' + appid,
				{},
				function FetchProgressClosure( results )
				{
					var elt = $( progressSelect.id );
					var statThisOne = null;
					if ( typeof achievement.progress === 'object' )
					{
						// here we hardcode that we only support direct stat access;
						// later when we do the expression-evaluator thing we'll redo this.
						statThisOne = achievement.progress.value.operand1;
					}
					
					results.sort(
						function( statLeft, statRight )
							{
								if ( statLeft.name < statRight.name )
								{
									return -1;
								}
								else if ( statLeft.name > statRight.name )
								{
									return 1;
								}
								else
								{
									return 0;
								}
							}
						);

					for ( i = 0; i < results.length; i++ )
					{
						option = document.createElement( "option" );
						option.text = results[i]['name'];
						option.value = results[i]['name'];
						
						AddOptionToSelect( elt, option );
						
						if ( results[i].name === statThisOne )
						{
							option.selected = true;
						}
					}
					
					noProgressOption.text = "None";
				}
			);
		
		// we use a form to contain each localizable field;
		// this gives us a convenient json serialization path
		// through prototype.
		doubleCell = row.insertCell( -1 );

		item = document.createElement( "form" );
		item.onchange = DirtyRowClosure( row );
		item.id = id + "_displayname";
		doubleCell.appendChild( item );
		AchievementEditLocalizeHelper( doubleCell, item, achievement, 'display_name', '_NAME' );

		item = document.createElement( "form" );
		item.onchange = DirtyRowClosure( row );
		item.id = id + "_description";
		doubleCell.appendChild( item );
		AchievementEditLocalizeHelper( doubleCell, item, achievement, 'description', '_DESC' );

		item = CreateStatPermissionSelect( id );
		item.onchange = DirtyRowClosure( row );
		item.selectedIndex = achievement[ "permission" ];
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.onclick = DirtyRowClosure( row );
		item.type = "checkbox";
		item.id = id + "_hidden";
		if ( achievement[ "hidden" ] != 0 )
		{
			item.checked = true;
		}
		row.insertCell( -1 ).appendChild( item );

		var achievementID = "a" + achievement[ "stat_id" ] + "_" + achievement[ "bit_id" ];

		// image upload forms
		formText = $('stock_upload_form').innerHTML;
		formText = formText.replace( /APPID/g, appid );
		formText = formText.replace( /STATID/g, achievement[ 'stat_id' ] );
		formText = formText.replace( /ACHIEVEMENTID/g, achievement[ 'bit_id' ] );
		formText = formText.replace( /REQUEST_TYPE/g, "achievement" );
		formText = formText.replace( /sxxxrc/g, "src" );
		formText = formText.replace( /IMAGE_SOURCE/g, achievement[ "icon" ] );
		formText = formText.replace( /IMAGE_ID/g, achievementID + "_icon" );
		formText = formText.replace( /GRAY/g, false );
		
		row.insertCell( -1 ).innerHTML = formText;

		formText = $('stock_upload_form').innerHTML;
		formText = formText.replace( /APPID/g, appid );
		formText = formText.replace( /STATID/g, achievement[ 'stat_id' ] );
		formText = formText.replace( /ACHIEVEMENTID/g, achievement[ 'bit_id' ] );
		formText = formText.replace( /REQUEST_TYPE/g, "achievement_gray" );
		formText = formText.replace( /sxxxrc/g, "src" );
		formText = formText.replace( /IMAGE_SOURCE/g, achievement[ "icon_gray" ] );
		formText = formText.replace( /IMAGE_ID/g, achievementID + "_icon_gray" );
		formText = formText.replace( /GRAY/g, true );

		row.insertCell( -1 ).innerHTML = formText;

		var btnCell = row.insertCell( -1 );

		var btn = document.createElement( "input" );
		btn.type= "submit";
		btn.onclick = RevertAchievementClosure( appid, achievement[ "stat_id" ], achievement[ "bit_id" ] );
		btn.value = "Cancel";
		btnCell.appendChild( btn );

		btnCell.appendChild( document.createElement( "br" ) );

		btn = document.createElement( "input" );
		btn.type= "submit";
		btn.onclick = SaveAchievementClosure( appid,
								   achievement[ "stat_id" ],
								   achievement[ "bit_id" ] );
		btn.value = "Save";
		btnCell.appendChild( btn );
		return id;
	}
}


//
// this function handles the grunt work of poking a stat or
// achievement into the document. It's just for doing the table grunt
// work and iterating; the item-specific stuff is handled by function
// references.
//
// it takes a bunch of data, and a couple of helper functions.
// fIdMaker turns the item into an id in the DOM. fSetter pokes the
// item into the row in question.
//
// 
function SetItemsWorker( appid, items, parentDivID, sourceDivID, newTableID, fIdMaker, fSetter )
{
	var parentDiv = document.getElementById( parentDivID );
	var sourceDiv = document.getElementById( sourceDivID );
	var count = items.length;

	parentDiv.innerHTML = sourceDiv.innerHTML;

	// firstChild is dangerous, fails if we change formatting ion table template
	theTable = parentDiv.firstChild;
	theTable.id = newTableID;
	
	// we need to find the tbody in the table, so our rows
	// go in the right place
	var insertionParent = theTable;

	// use the first tbody we found, or just stick everything in table if we couldn't find one
	if ( theTable.tBodies.length != 0 )
	{
		insertionParent = theTable.tBodies[ 0 ];
	}
	
	// crack parameter and iterate achievements/stats
	for ( var index = 0; index < count; index++ )
	{
		var theItem = items[ index ];

		// append ID-laden achievement to our shiny new table
		var newRow = insertionParent.insertRow( -1 );
		newRow.vAlign = "top";

		newRow.id = fIdMaker( theItem );
		fSetter( appid, newRow, theItem );
	}
}


//
// sets up achievement table with given achievements
//
function SetAchievements( appid, achievements )
{
	SetItemsWorker( appid,
				achievements,
				"appAchievementDisplay",
				"achievementTableSource",
				"achievementTable",
				function( theItem ) { return "a" + theItem[ "stat_id" ] + "_" + theItem[ "bit_id" ]; },
				SetAchievement
				);
}


//
//sets up a bunch of divs with given achievements
//
function SetAchievementsDiv( appid, achievements )
{
	var parentDiv = $('appAchievementDisplay');
	var theItem;
	var index;
	var items = achievements;
	var elt;
	var eltSub;
	var eltRow;
	var text;
	var newImg;
	
	parentDiv.update('');
	
	// crack parameter and iterate achievements/stats
	for ( index = 0; index < items.length; index++ )
	{
		theItem = items[ index ];

		// make a new container "row" div for the whole item
		eltRow = new Element( 'div' );
		parentDiv.insert( eltRow );
		
		var achievement = theItem;
		
		// achievement specific:
		// jam a bunch of floated-left divs in there to hold the item's fields
		elt = new Element( 'div', { 'style' : 'float: left; width: 6em' } );
		elt.update( achievement[ "stat_id" ] + "/" + achievement[ "bit_id" ] );
		eltRow.insert( elt );
		
		elt = new Element( 'div', { 'style' : 'float: left; width: 24em' } );
		elt.update( achievement[ 'api_name' ] );
		elt.insert( new Element( 'br' ) );
		// Add the achievement progress stat line
		if ( typeof achievement[ 'progress' ] === 'object' )
		{
			// currently only support direct stat value mapping
			progressSpan = new Element( 'span' );
			progressSpan.innerHTML = achievement.progress.value.operand1 + ' (' + achievement.progress.min_val + '-' + achievement.progress.max_val + ')';
			
			elt.insert( progressSpan );
		}
		eltRow.insert( elt );

		
		elt = new Element( 'div', { 'style' : 'float: left; width: 36em' } );
		var rgLanguageDisplay = g_rgLanguages;
		var bPrefix = false;
		var languages;
		if ( g_language == "all" )
		{
			languages = g_rgEditingLanguages;
			bPrefix = true;
		}
		else
		{
			languages = {};
			languages[ g_language ] = 1;
		}

		for ( language in languages )
		{
			eltSub = AchievementSpan( achievement, "display_name", achievement.api_name + '_NAME', language );
			if ( bPrefix )
			{
				eltSub.insert( { 'top' : new Element( 'span' ).update( "[" + rgLanguageDisplay[ language ] + "] ") } );
			}
			elt.insert( eltSub );
		}
		
		// TODO mrhoten Commonify description and display name
		for ( language in languages )
		{
			eltSub = AchievementSpan( achievement, "description", achievement.api_name + '_DESC', language );
			if ( bPrefix )
			{
				eltSub.insert( { 'top' : new Element( 'span' ).update( "[" + rgLanguageDisplay[ language ] + "] ") } );
			}
			elt.insert( eltSub );
		}
		eltRow.insert( elt );
		
		elt = new Element( 'div', { 'style': 'float: left; width: 5em' } );
		switch ( achievement[ "permission" ] )
		{
		case "1": elt.update( "GS" ); break;
		case "2": elt.update( "Official GS" ); break;

		case "0": 
		default: 
			elt.update( "Client" );
		}
		eltRow.insert( elt );
		
		// give this element a minimum height, since it is often empty of content and
		// would snap to zero height
		elt = new Element( 'div', { 'style': 'float: left; width: 4em; height: 1em' } );
		if ( achievement[ "hidden" ] != 0 )
		{
			elt.update( "<b>Yes</b>" );
		}
		eltRow.insert( elt );

		newImg = new Element( 'img', { 'style': 'float: left' } );
		newImg.src = achievement[ "icon" ];
		newImg.height = 64;
		newImg.width = 64;
		eltRow.insert( newImg );

		newImg = new Element( 'img' );
		newImg.src = achievement[ "icon_gray" ];
		newImg.height = 64;
		newImg.width = 64;
		eltRow.insert( newImg );
//		var btnCell = destRow.insertCell( -1 );
//
//		var btn = document.createElement( "input" );
//		btn.type= "submit";
//	 	btn.onclick = EditAchievementClosure( appid, achievement[ "stat_id" ], achievement[ "bit_id" ] );
//		btn.value = "Edit";
//		btnCell.appendChild( btn );
//
//		btnCell.appendChild( document.createElement( "br" ) );
//
//		var btn2 = document.createElement( "input" );
//		btn2.type = "submit";
//	 	btn2.onclick = DeleteAchievementClosure( appid, achievement[ "stat_id" ], achievement[ "bit_id" ] );
//		btn2.value = "Delete";
//		btnCell.appendChild( btn2 );
//
		// all done with this row
		eltRow.insert( new Element( 'div', { 'style' : 'clear: both' } ) );
	}
}


//
// sets up stats table with given stats
//
function SetStats( appid, stats )
{
	SetItemsWorker( appid,
					stats,
					"appStatDisplay",
					"statTableSource",
					"statTable",
					function( theItem ) { return "s" + theItem[ "stat_id" ]; },
					SetStat );
}

//
// sets up stats table with given stats
//
function SetDrmModules( appid, drmModules )
{
	SetItemsWorker( appid,
					drmModules,
					"appDrmDisplay",
					"drmTableSource",
					"drmTable",
					function( theItem ) { return "d" + theItem[ "buildcrc" ]; },
					SetDrmModule );
}


//
// worker function for replacement of a row in one of our tables
//
function ReplaceWorker( appid, item, itemRow, fSetter )
{
	if ( typeof( itemRow ) == "object" )
	{
		ClearRow( itemRow );
		itemRow.className = "";
		fSetter( appid, itemRow, item );
	}
}


//
// pokes a stat back into the table - used for "revert edited stat"
// case.
//
function ReplaceStat( appid, stat )
{
	var statRow = document.getElementById( "s" + stat[ "stat_id" ] );
	ReplaceWorker( appid, stat, statRow, SetStat );
}


// simple "either/or" routine to avoid a bunch of ternaries
function FetchAlternate( item, field, alternate )
{
	return field in item ? item[ field ] : alternate;
}


//
// pokes a given stat into a given DOM element for its TR.
//
// assumes the row is empty at entry.
// 
function SetStat( appid, destRow, stat )
{
	destRow.insertCell( -1 ).innerHTML = stat[ "stat_id" ];
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "type", "" );
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "name", "" );

	switch ( stat[ "permission" ] )
	{
	case "1": destRow.insertCell( -1 ).innerHTML = "GS"; break;
	case "2": destRow.insertCell( -1 ).innerHTML = "Official GS"; break;

	case "0": 
	default: 
		destRow.insertCell( -1 ).innerHTML = "Client";
	}

	var incrementVal = "";
	if ( "incrementonly" in stat && stat[ "incrementonly" ] != 0 )
	{
		incrementVal = "Yes";
	}
	destRow.insertCell( -1 ).innerHTML = incrementVal;
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "maxchange", "" );
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "min", "" );
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "max", "" );
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "windowsize", "" );
	destRow.insertCell( -1 ).innerHTML = FetchAlternate( stat, "default", "" );
	var aggregateVal = "";
	if ( "aggregated" in stat && stat[ "aggregated" ] != 0 )
	{
		aggregateVal = "Yes";
	}
	destRow.insertCell( -1 ).innerHTML = aggregateVal;

	var displayName = "";
	if ( "display" in stat )
	{	
		if ( "name" in stat["display"] )
		{
			displayName = stat["display"]["name"];
		}
	}
	destRow.insertCell( -1 ).innerHTML = displayName;

	var btnCell = destRow.insertCell( -1 );

	var btn = document.createElement( "input" );
	btn.type= "submit";
 	btn.onclick = EditStatClosure( appid, stat[ "stat_id" ] );
	btn.value = "Edit";
	btnCell.appendChild( btn );

	var theSpan = document.createElement( "span" );
	theSpan.innerHTML = "&nbsp;";
	btnCell.appendChild( theSpan );

	var btn2 = document.createElement( "input" );
	btn2.type = "submit";
 	btn2.onclick = DeleteStatClosure( appid, stat[ "stat_id" ], stat[ "bit_id" ] );
	btn2.value = "Delete";
	btnCell.appendChild( btn2 );
}


function EditStat( appid, stat )
{
	var statRow = document.getElementById( "s" + stat[ "stat_id" ] );
	if ( typeof( statRow ) == "object" )
	{
		var id = "stat" + stat[ 'stat_id' ];
		var row = statRow; // less typing
		var item;

		ClearRow( row );
		row.className = "selected";

		var doubleCell = row.insertCell( -1 );
		doubleCell.innerHTML = stat[ "stat_id" ];

		item = document.createElement( "a" );
		var newHash = id + "_edit";
		item.name = newHash;
		doubleCell.appendChild( item );

		item = document.createElement( "select" );
		item.style.width = "6em";
		item.id = id + "_stattype";
		
		var item2 = document.createElement( "option" );
		item.options.add( item2 );
		item2.innerHTML = "INT";
		item2.value = "INT";
		if ( stat[ 'type' ] == 'INT' )
		{
			item2.selected = true;
		}

		item2 = document.createElement( "option" );
		item.options.add( item2 );
		item2.innerHTML = "FLOAT";
		item2.value = "FLOAT";
		if ( stat[ 'type' ] == 'FLOAT' )
		{
			item2.selected = true;
		}

		item2 = document.createElement( "option" );
		item.options.add( item2 );
		item2.innerHTML = "AVGRATE";
		item2.value = "AVGRATE";
		if ( stat[ 'type' ] == 'AVGRATE' )
		{
			item2.selected = true;
		}

		// onchange closure for item type; hides/shows the windowsize edit control
		// and fills in a value if necessary.
		var itemType = item;
		item.onchange = function()
		{
			fn = DirtyRowClosure( row );
			fn();

			fSetEnabledState = function( subItem, bEnable )
			{
				if ( bEnable )
				{
					subItem.disabled = false;
					subItem.style.display = 'block';
				}
				else
				{
					// we don't adequately style disabled inputs; however,
					// it really makes more sense to hide this one anyway
					subItem.disabled = true;
					subItem.style.display = 'none';

					// don't destroy any value in the stat; the user
					// may flip back and we'd like to preserve the data.
				}
			};

			bAvgRate = itemType.value == 'AVGRATE';
			fSetEnabledState( $( id + '_windowsize' ), bAvgRate );
			fSetEnabledState( $( id + '_incrementonly' ), !bAvgRate );
			fSetEnabledState( $( id + '_maxchange' ), !bAvgRate );
			fSetEnabledState( $( id + '_aggregated' ), !bAvgRate );

			if ( bAvgRate )
			{
				// check value; populate if required
				subItem = $( id + '_windowsize' );
				if ( subItem.value == '' )
				{
					subItem.value = '10.0';
				}
			}
		};
		
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.style.width = "100%";
		item.id = id + "_statapiname";
		item.value = FetchAlternate( stat, "name", "stat_" + stat[ 'stat_id' ] );
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = CreateStatPermissionSelect( id );
		item.selectedIndex = stat[ "permission" ];
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.type = "checkbox";
		item.id = id + "_incrementonly";
		if ( "incrementonly" in stat && stat[ "incrementonly" ] != 0 )
		{
			item.checked = true;
		}
		item.onclick = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.style.width = "4em";
		item.id = id + "_maxchange";
		item.value = FetchAlternate( stat, "maxchange", "" );
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.style.width = "4em";
		item.id = id + "_min";
		item.value = FetchAlternate( stat, "min", "" );
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.style.width = "4em";
		item.id = id + "_max";
		item.value = FetchAlternate( stat, "max", "" );
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		// stats of type 'avgrate' get a window size parameter; others do not. we
		// show the UI all the time, and enable/disable it on the fly.
		item = document.createElement( "input" );
		item.style.width = "4em";
		item.id = id + "_windowsize";
		item.value = FetchAlternate( stat, "windowsize", "" );
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.style.width = "4em";
		item.id = id + "_default";
		item.value = FetchAlternate( stat, "default", "" );
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		item = document.createElement( "input" );
		item.type = "checkbox";
		item.id = id + "_aggregated";
		if ( "aggregated" in stat && stat[ "aggregated" ] != 0 )
		{
			item.checked = true;
		}
		item.onclick = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );
		
		item = document.createElement( "input" );
		item.style.width = "100%";
		item.id = id + "_displayname";
		var displayName = "";
		if ( "display" in stat )
		{	
			if ( "name" in stat["display"] )
			{
				displayName = stat["display"]["name"];
			}
		}
		item.value = displayName;
		item.onchange = DirtyRowClosure( row );
		row.insertCell( -1 ).appendChild( item );

		var btnCell = row.insertCell( -1 );

		var btn = document.createElement( "input" );
		btn.type= "submit";
		btn.onclick = RevertStatClosure( appid, stat[ "stat_id" ] );
		btn.value = "Cancel";
		btnCell.appendChild( btn );

		var theSpan = document.createElement( "span" );
		theSpan.innerHTML = "&nbsp;";
		btnCell.appendChild( theSpan );

		btn = document.createElement( "input" );
		btn.type= "submit";
		btn.onclick = SaveStatClosure( appid,
									   stat[ "stat_id" ] );
		btn.value = "Save";
		btnCell.appendChild( btn );

		// Apply initial visibility
		itemType.onchange();

		return id;
	}
}

function FlagsToString( flags )
{
	if ( flags == 544 ) return 'Static, simple check';
	if ( flags == 559 ) return 'Static, all checks';
	if ( flags == 527 ) return 'Dynamic, generic checks';
	if ( flags == 783 ) return 'Dynamic, machine specific';
	if ( flags == 128 ) return 'SDK DRM';
	if ( flags == 38 ) return 'Compatibility';
	if ( flags == 32 ) return 'Standard';
	
	return flags;
}

//
// pokes a given stat into a given DOM element for its TR.
//
// assumes the row is empty at entry.
// 
function SetDrmModule( appid, destRow, drmModule )
{
	var d=new Date();
	d.setTime( drmModule[ 'date' ]*1000 );
	var downloadlink = '<a href="'+ drmModule[ 'download' ]+ '">' + drmModule[ 'module' ] + '</a>';
	
	destRow.insertCell( -1 ).innerHTML = drmModule[ 'buildcrc' ];
	destRow.insertCell( -1 ).innerHTML = downloadlink;

	// drmtoolp writes modtype
    if ( drmModule[ 'modtype' ] !== undefined )
    {
        destRow.insertCell( -1 ).innerHTML = drmModule[ 'modtype' ];
    }
    else
    {
	    // otherwise must be drmtool
        destRow.insertCell( -1 ).innerHTML = "(Legacy) Win32 PE";
    }
    destRow.insertCell( -1 ).innerHTML = FlagsToString( drmModule[ 'flags' ] );
	destRow.insertCell( -1 ).innerHTML = d.toLocaleString();
}

function EditDrmModule( drmModule )
{

}

//
//flip the state of whether an app uses items
//
function SetInstallscriptOverride( appid, bOverride )
{
	$('overrideOutput').innerHTML = 'Saving...';
	
	callback = function( results ) 
		{ 
			StandardCallback( results, 'overrideOutput' );
		}
		
	AppsAjaxRequest(
		g_szBaseURL + '/apps/setinstallscriptoverride/' + appid,
		{ 'override' : bOverride ? "1" : "0" },
		callback
		);
}


//
// set which tab is active on the items page
//

function ItemsPageSetActiveTab( tabName )
{
	tabs = new Array( "basicSettings", "qualityDefs", "itemDefs", "attributeDefs", "timeRewards", "dailyRewards", "itemAdmin" );
	for ( i = 0; i < tabs.length; i++ )
	{
		curTabDiv = $( tabs[i] + 'Tab' );
		curTabBody = $( tabs[i] ); 
	
		if ( tabName == tabs[i] )
		{
			curTabDiv.className = 'tab activetab';
			curTabBody.style.display = 'block';
		}
		else
		{
			curTabDiv.className = 'tab';
			curTabBody.style.display = 'none';
		}
	}
}


//
// set the official server IPs for this app
//
function SetOfficialGameServers( appid, serverIPs )
{
	AppsAjaxRequest(
		g_szBaseURL + '/apps/setofficialgs/' + appid,
		{ 'officialGSs' : serverIPs },
		CommonSetHandler,
		'post'
		);
}


//
// set the official server IPs for this app
//
function SetDedicatedGameServers( appid, gamedir, versions, message )
{
	AppsAjaxRequest(
		g_szBaseURL + '/apps/setdedicatedgs/' + appid,
		{ 
			'gamedir' : gamedir,
			'versions' : versions,
		    'message' : message 
		},
		CommonSetHandler
		);
}


//
//
function SetDedicatedGameServers( appid, gamedir, versions, message )
{
	AppsAjaxRequest(
		g_szBaseURL + '/apps/setdedicatedgs/' + appid,
		{ 
			'gamedir' : gamedir,
			'versions' : versions,
		    'message' : message 
		},
		CommonSetHandler
		);
}


//
// handler that runs when the app filter string changes. Rebuilds the
// app listbox based on the filter string. Used only in the errors
// templates.
// 
function FilterAppErrorList( appid )
{
	var filter = "";
	
	var elt = document.getElementById( 'filterApps' );

	if ( null != elt )
	{
		filter = elt.value;
	}

	BuildAppList( filter, appid, true );
}




function GetSelectValue( name )
{
	var selectElem = document.getElementById( name );
	return selectElem.options[ selectElem.selectedIndex ].value;
}

function GetElementValue( name )
{
	return document.getElementById( name ).value;
}

function ResetElement( name )
{
	document.getElementById( name ).innerHTML = '';
}

function ResetInput ( name )
{
	document.getElementById( name ).value = '';
}

function EnableElement( name )
{
	document.getElementById( name ).disabled = false;
}

function DisableElement( name )
{
	document.getElementById( name ).disabled = false;
}

function HideElement( name )
{
	document.getElementById( name ).style.display = 'none';
}

function ShowElement( name )
{
	document.getElementById( name ).style.display = 'block';
}

function ElementVisible( name )
{
	return document.getElementById( name ).style.display == 'block';
}


function GetandClearElement( name )
{
	value = GetElementValue( name );
	ResetElement( name );
	return value;
}

function GetUserName()
{
	return GetElementValue( 'hiddenUser' );
}

function ImageUploadCallback(jsonResponse)
{
	var results = jsonResponse.evalJSON(true);
	
	// poke in results
	StandardCallback( results, 'upload_response' );
	
	// look for any new images we can replace in the DOM. because we
	// get these data out of the DOM (our image uploader stashes them
	// in an iframe) we need to decode them. first, we figure out
	// where in the DOM the results need to go.
	if ( 'images' in results )
	{
		var imageType;
		for ( imageType in results[ 'images' ] )
		{
			var id = false;
			switch ( imageType )
			{
			case "logo":
				id = "appLogo";
				break;
			case "logo_small":
				id = "appLogoSmall";
				break;
			case "icon":
				id = "appIcon";
				break;
			case "clienticon":
				id = "appIco";
				break;
			case "clienttga":
				id = "appTga";
				break;
			}
			if ( id )
			{
				var url = unescape( results[ 'images' ][ imageType ] );
				var elt = document.getElementById( id );
				elt.src = url;
			}
		}
	}	
}

function AchievementLocCallbackClosure( appid )
{
	theClosure = function( jsonResponse )
		{
			var results = jsonResponse.evalJSON(true);
			
			// poke in results
			StandardCallback( results, 'loc_upload_response' );
			return false;
		};

	return theClosure;
}

function AchievementImageUploadCallbackClosure( appid, statid, bitid, gray )
{
	theClosure = function( jsonResponse )
		{
			var response = jsonResponse.evalJSON(true);
			StandardCallback( response, 'achievement_upload_response' );
	
			AppsAjaxRequest( g_szBaseURL + "/apps/fetchachievement/" + appid + "/" + statid + "/" + bitid,
				{},
				function( results )
				{
					var val = gray ? "icon_gray" : "icon";
					$( IDFromAchievement( statid, bitid) + "_" + val ).src = results[ val ];
					
					fn = DirtyRowClosure( $( IDFromAchievement( statid, bitid ) ) );
					fn();
				}
				);
		};

	return theClosure;
}

function SteamworksDRMCallback(appid, jsonResponse)
{
	var results = jsonResponse.evalJSON(true); 
	
	StandardCallback( results, 'steamwork_drm_response' ); 
	
}

function InstallScriptUploadCallback(appid, jsonResponse)
{
	var results = jsonResponse.evalJSON(true);
	
	StandardCallback( results, 'installscript_upload_response' );
	LoadInstallScript( appid );
}

function ScreenshotUploadCallback( appid, jsonResponse )
{
	var results = jsonResponse.evalJSON( true );
	
	StandardCallback( results, 'screenshot_upload_response' );
	document.forms['screenshot_upload_form'].reset();
	LoadScreens( appid );
}

function CommunityCapsuleUploadCallback( appid, jsonResponse )
{
	var results = jsonResponse.evalJSON( true );
	
	StandardCallback( results, 'capsule_upload_response' );
	
	// poke the image in there
	if ( 'images' in results )
	{
		if ( 'community_capsule' in results.images )
		{
			var url = unescape( results.images.community_capsule );
			$( 'appCapsule' ).src = url;
			$( 'appCapsuleInfo' ).innerHTML = '';
		}
	}
}

function ShowHideDiff( bShow )
{
	if ( bShow )
	{
		ShowElement( "appDiff" )
	}
	else
	{
		HideElement( "appDiff" );
	}
}


function ShowHideOutput( bShow )
{
	if ( bShow )
	{
		ShowElement( "appOutput" )
	}
	else
	{
		HideElement( "appOutput" );
	}
}


function PrepareApp( appid, section )
{
	$('appOutput').innerHTML = "";
	ShowHideDiff( false );
	ShowHideOutput( true );
	AppsAjaxRequest( g_szBaseURL + "/apps/prepare/" + appid,
					{ 'section': section },
					function( results )
					{
						StandardCallback( results, 'appOutput' );
						if ( results[ 'success' ] )
						{
							$('publishHidden').style.display = '';
                            $('publishbtn').style.display = 'block';
						}
					}
				);
}


function CDNApp( appid )
{
	$('appOutput').innerHTML = "Publishing app images...";

	AppsAjaxRequest( g_szBaseURL + "/apps/cdnpush/" + appid,
					{},
					function( results )
					{
						StandardCallback( results, 'appOutput' );
					}
				);
}


function DiffApp( appid, section )
{
	$('appOutput').innerHTML = '';
	$('appDiff').innerHTML = '';
	ShowHideDiff( true );
	ShowHideOutput( false );
	AppsAjaxRequest( g_szBaseURL + "/apps/diff/" + appid,
					{ 'section': section },
					function( results )
					{
						theDiffs = results[ 'opened' ] + results[ 'diff' ];
						if ( theDiffs == "" )
						{
							theDiffs = "[No changes detected.]";
						}
						$('appDiff').innerHTML = "<pre>" + theDiffs + "</pre>";
					}
				);
}

function RevertApp( appid, section )
{
	if ( !confirm( "Revert all unpublished changes?" ) )
	{
		return;
	}

	$('appOutput').innerHTML = "";
	ShowHideDiff( false );
	ShowHideOutput( true );
	$('appDiff').innerHTML = '';
	$('publishbtn').style.display = 'none';

	AppsAjaxRequest( g_szBaseURL + "/apps/revert/" + appid,
					{ 'section': section },
					function( results )
					{
						StandardCallback( results, 'appOutput' );
					}
				);
}



//
// This routine builds the app listbox.
// 
// Coupled to g_rgApps, a global which is emitted server side into the template.
//
function BuildAppList( filterString, appidSelect, bAddAll )
{
	filterString = filterString.toLowerCase();

	var appSelect = document.getElementById( 'appSelect' );
	appSelect.options.length = 0;

	var i = 0;

	// Add the all games option, if appropriate
	if ( bAddAll && filterString.length == 0 )
	{
		appSelect.options[i] = new Option( "[All]", 0 );
		appSelect.options[i].id = "opt0";
		if ( appidSelect == 0 )
		{
			appSelect.options[i].selected = true;
		}
		i++;
	}
	
	for ( appid in g_rgApps )
	{
		lc = g_rgApps[appid].toString().toLowerCase();
		if ( filterString.length == 0 || lc.indexOf( filterString ) != -1 )
		{
			appSelect.options[i] = new Option( g_rgApps[appid], appid );
			appSelect.options[i].id = "opt" + appid;
			if ( appid == appidSelect )
			{
				appSelect.options[i].selected = true;
			}
			i++;
		}
	}
}


//
// chunked uploads to cross-domain server once we have acquired an upload token
//
function startChunkUploads( inputItem, onFinish )
{
    return function ( initResults )
    {
        // check and fire up the actual upload
        var blob = inputItem.files[0];
        // lol, const.
        var BYTES_PER_CHUNK = 2 * 1024 * 1024; // 2MB chunk sizes.
        var SIZE = blob.size;
        var start = 0;
        var end = start + BYTES_PER_CHUNK;
        var status = {
            'pending': Math.ceil( SIZE / BYTES_PER_CHUNK ),
            'succeeded': 0,
            'failed': 0,
            totalUploaded: 0
        };

        // keep these synchronous for now; the back end server does not take kindly to
        // multiple outstanding requests
        while ( start < SIZE ) {
            end = Math.min( end, SIZE );
            jQuery.ajax( initResults[ 'location' ], {
                async: true,
                accepts: 'application/json',
                type: 'POST',
                error: function( jqXHR, textStatus, errorThrown ) {
                    // handle bogus chrome errors
                    if ( jqXHR.readyState == 0 ) {
                        return;
                    }
                    jqXHR.bChunkFailed = true;
                },
                complete: function( jqXHR, textStatus ) {
                    var cCurrent = --status.pending;
                    // because of some bogus chrome errors, we cannot rely on success being called.
                    if ( jqXHR.bChunkFailed )
                    {
                        status.failed++;
                    }
                    else
                    {
                        status.succeeded++;
                        status.totalUploaded += ( end - start );
                    }
                     // see if we need to fire the "all done" callback
                    if ( cCurrent == 0 )
                    {
                        onFinish( initResults, status );
                    }
                },
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + SIZE
                },
                data: blob.slice( start, end ),
                processData: false
            } );
            start = end;
            end = start + BYTES_PER_CHUNK;
        }
    }
}


//
// sets up the language UI in the achievements page
//
// preselect English if available, or the first if not
//
function PopulateAchievementLanguages( appid, languages )
{
	langSelect = $('languageSelect');

	// mutate languages global to include our loc tokens item
	g_rgLanguages[ 'token' ] = 'Localization Token';

	// select the english language if it is available; otherwise
	// pick the first one in the list.
	var victim = "english"
	if ( !( "english" in languages ) )
	{
		victim = Object.keys(languages)[ 0 ];
	}
	g_language = victim;
	
	var cLanguages = 0;
	var i = 2;								// leave two holes - for "all" and "tokens"
	for ( lang in languages )
	{
		// add language to language selector
		langSelect.options[i] = new Option( g_rgLanguages[lang], lang);
		langSelect.options[i].id = "opt" + lang;
		
		if ( lang == victim )
		{
			langSelect.options[i].selected = true;
		}
		
		// add language to list of current editing languages
		g_rgEditingLanguages[ lang ] = 1;
		i++;
		cLanguages++;
	}
	
	// this routine is also side effecting through the g_bLocalized global,
	// which indicates whether the app supports more than one language (thus
	// enabling a bunch of localization-related UI).
	if ( cLanguages > 1 )
	{
		$( 'languageDiv' ).style.display = '';
		g_bLocalized = true;
	}

}


//
// handler for selecting a language while editing achievements.
// re-fetches achievements; when they display, they will pick up
// the new language.
// 
function LanguageSelect( appid )
{
	var langSelect = $('languageSelect');
	g_language = langSelect.options[ langSelect.selectedIndex ].value;
	
	// issue ajax request to fetch achievements,
	// then when they come back, poke them into the document
	
	$('appAchievementDisplay').innerHTML = "Loading achievements...";
	
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchachievements/" + appid,
		{},
		function( results )
		{
			SetAchievements( appid, results[ 'achievements' ] );
		}
		);
}


//
// startup function for the achievements page
//
function LoadAchievements( appid )
{
	// issue ajax request to fetch achievements,
	// then when they come back, poke them into the document
	
	$('appAchievementDisplay').innerHTML = "Loading achievements...";
	
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchachievements/" + appid,
		{},
		function( results )
		{
			// this operation needs to happen before the other AJAX
			// requests are initiated, so the languages dropdown
			// and current language are populated prior to examining
			// or populating the achievements.
			PopulateAchievementLanguages( appid, results[ 'languages' ] );

 			LoadAchievementCounts( appid );
			SetAchievements( appid, results[ 'achievements' ] );
 		}
		);
}


//
// startup function for the stats page
//
function LoadStats( appid )
{
	// issue ajax request to fetch stats,
	// then when they come back, poke them into the document
	
	$('appStatDisplay').innerHTML = "Loading gameplay stats...";
	
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchstats/" + appid,
		{},
		function( results )
		{
			SetStats( appid, results );
		}
		);
}

//
// startup function for the DRM page
//
function LoadDRM( appid )
{
	// issue ajax request to fetch DRM modules,
	// then when they come back, poke them into the document
	
	$('appDrmDisplay').innerHTML = "Loading application DRM information...";
	
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchdrm/" + appid,
		{},
		function( results )
		{
			SetDrmModules( appid, results );
		}
		);
}

//
// function for the install script page to re-render install script
// after an upload
//
function LoadInstallScript( appid )
{
	// issue ajax request to fetch install script,
	// then poke it into the document
	
	AppsAjaxRequest( g_szBaseURL + "/installscript/fetch/" + appid,
		{},
		function( results )
		{
			if ( results[ 'success' ] == false )
			{
				$('installScriptNotPopulated').style.display = '';
				$('installScriptPopulated').style.display = 'none';
			}
			else
			{
				$('installScriptNotPopulated').style.display = 'none';
				$('installScriptPopulated').style.display = '';
				$('appInstallScriptDisplay').innerHTML = results[ 'installscript' ];
			} 
		}
		);
}


//
// startup function for the signing page
//
function LoadSigningInfo( appid )
{
	// issue ajax request to fetch signing info,
	// then when they come back, poke them into the document
	
	$('signinginfo_display').innerHTML = "Loading signing info...";
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchsigninginfo/" + appid,
		{},
		function( results )
		{
		    var signatureCheckOnLaunchWindows = [];
		    if( results['signaturescheckedonlaunch'] && results['signaturescheckedonlaunch']['windows'] )
		    {
		        signatureCheckOnLaunchWindows = results['signaturescheckedonlaunch']['windows'];
		    }
		    var signatureCheckOnLaunchOSX = [];
		    if( results['signaturescheckedonlaunch'] && results['signaturescheckedonlaunch']['osx'] )
		    {
		        signatureCheckOnLaunchOSX = results['signaturescheckedonlaunch']['osx'];
		    }
		    
	            for( var filename in results['signedfiles'] )
	            {
	                var row = AddSigningRow();
	                row['file'].value = filename;
	                row['key'].value = results['signedfiles'][filename];
	                if( -1 != signatureCheckOnLaunchWindows.indexOf(filename) )
	                {
	                    row['checkonlaunch']['windows'].checked = true;
	                }
			if( -1 != signatureCheckOnLaunchOSX.indexOf(filename) )
			{
				row['checkonlaunch']['osx'].checked = true;
			}
	            }
             
		    $('signinginfo_display').innerHTML = "";
		}
		);
}


function DeleteScreenClosure( appid, screenid )
{
	var theClosure = 
	function()
		{
			AppsAjaxRequest( g_szBaseURL + "/apps/deletescreen/" + appid + "/" + screenid,
				{},
				function( results )
				{
					StandardCallback( results, 'screenshot_upload_response' );
					LoadScreens( appid );
				} );
			return false;
		};
	return theClosure;
}


// populate document from set of screenshots
function SetScreens( appid, screens )
{
	if ( screens.length == 0 )
	{
		$('screenshots').innerHTML = 'Your game has no community screen shots. You can upload some above.';
		return;
	}
	
	$('screenshots').innerHTML = '';
	
	for ( var id = 0; id < screens.length; id++ )
	{
		var divScreen = document.createElement( 'div' );
		divScreen.className = 'screenshot';
		
		var imageBase = g_szBaseURL + "/public/get_appimage.php?appid=" + appid + "&filetype=jpg&id=";
		
		var anchor = document.createElement( 'a' );
		anchor.href = imageBase + screens[id]['screen'] + ".jpg";
		
		var img = document.createElement( 'img' );
		img.src = imageBase + screens[id]['screen_thumb'] + ".jpg";
		img.border = 0;
		
		anchor.appendChild( img );
		divScreen.appendChild( anchor );
		divScreen.appendChild( document.createElement( 'br' ) );

		var anchor2 = document.createElement( 'a' );
		anchor2.onclick = DeleteScreenClosure( appid, id );
		var deleteUrl = g_szBaseURL + "/apps/deletescreen/" + appid + "/" + id;
		anchor2.href = deleteUrl;
		anchor2.innerHTML = "Delete";

		divScreen.appendChild( anchor2 );
		
		$('screenshots').appendChild( divScreen );  
	}
}


//
// startup function for the community page
//
function LoadScreens( appid )
{
	// issue ajax request to fetch screen shots,
	// then when they come back, poke them into the document
	
	$('screenshots').innerHTML = "Loading screen shots...";
	
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchscreens/" + appid,
		{},
		function( results )
		{
			SetScreens( appid, results[ 'screens' ] );
 		}
		);
}

// populate document from set of screenshots
function SetAvatars( appid, avatars )
{
	if ( avatars.length == 0 )
	{
		$('avatars').innerHTML = 'Your game has no community avatars. You can upload some above.';
		return;
	}
	
	$('avatars').innerHTML = '';
	rgAvatars=avatars;
	
	for ( var id = 0; id < avatars.length; id++ )
	{
		var divAvatar = document.createElement( 'div' );
		divAvatar.className = 'avatar';
		
		var imageBase = g_szBaseURL + "/public/get_appimage.php?appid=" + appid + "&filetype=jpg&id=";
		
		var anchor = document.createElement( 'a' );
		anchor.href = '#';
		anchor.onclick = avatarPopupClosure(appid, avatars[id]);
				
		var imgMed = document.createElement( 'img' );
		imgMed.src = imageBase + avatars[id]['avatar_medium'] + '.jpg';
		imgMed.border = 0;
		anchor.appendChild( imgMed );
		
		divAvatar.appendChild( anchor );
		divAvatar.appendChild( document.createElement( 'br' ) );

		var anchor2 = document.createElement( 'a' );
		anchor2.onclick = DeleteAvatarClosure( appid, id );
		var deleteUrl = g_szBaseURL + "/apps/deleteavatar/" + appid + "/" + id;
		anchor2.href = deleteUrl;
		anchor2.innerHTML = "Delete";

		divAvatar.appendChild( anchor2 );
		
		$('avatars').appendChild( divAvatar );  
	}
}

function avatarPopupClosure(appid, avatar)
{
	var func=function(event) {avatarPopup(event, appid , avatar ); return false;};
	return func;
}

function avatarPopup(event, appid, avatar)
{
	var imageBase = g_szBaseURL + "/public/get_appimage.php?appid=" + appid + "&filetype=jpg&id=";

	var e=event;
	if (! e )
		e=window.event; // Microsoft-style
	
	var w=350;
	var h=250;

	var win = window.open('','avatar','height=' + h + ',width=' + w + ',left=' + (e.screenX-225) + ',top=' + (e.screenY-175) + ',toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no');
	win.document.write('<html><head><title>Avatar Preview</title>');
	win.document.write('<link href="' + g_szBaseURL + '/public/css/styles_global.css" rel="stylesheet" type="text/css" />'); // TODO AFARNSWORTH
	win.document.write('</head><body style="padding: 20px; cursor: pointer;" onclick="window.close()" onload="document.getElementById(\'root\').style.display=\'block\'">');
	win.document.write('<div id="root" style="display: none;">');

	win.document.write('<div id="avatarBlockFull"><img src="' + imageBase + avatar['avatar_full'] + '.jpg" /><p class="avatarSizeDesc">184px</p></div>');
	win.document.write('<div id="avatarBlockMedium"><img src="' + imageBase + avatar['avatar_medium'] + '.jpg" /><p class="avatarSizeDesc">64px</p></div>');
	win.document.write('<div id="avatarBlockIcon"><img src="' + imageBase + avatar['avatar_icon'] + '.jpg" /><p class="avatarSizeDesc">32px</p></div>');
	win.document.write('<br clear="all" />click anywhere to close');
	win.document.write('</div>');
	win.document.write('</body></html>');
	win.document.close();
	win.focus();
	
}

function LoadAvatars( appid )
{
	$('avatars').innerHTML = "Loading avatars...";
	
	AppsAjaxRequest( g_szBaseURL + "/apps/fetchavatars/" + appid,
		{},
		function( results )
		{
			SetAvatars( appid, results[ 'avatars' ] );
		}
		);
}


function AvatarUploadCallback(appid, jsonResponse)
{
	var results = jsonResponse.evalJSON( true );

	StandardCallback( results, 'avatar_upload_response' );
	document.forms['avatar_upload_form'].reset();
	
	LoadAvatars( appid );
}


function DeleteAvatarClosure( appid, screenid )
{
	var theClosure = 
	function()
		{
			AppsAjaxRequest( g_szBaseURL + "/apps/deleteavatar/" + appid + "/" + screenid,
				{},
				function( results )
				{
					StandardCallback( results, 'avatar_upload_response' );
					LoadAvatars( appid );
				} );
			return false;
		};
	return theClosure;
}


// handler for saving app language list
//
function SetAppLanguages( appid )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/savelanguages/' + appid,
		$('languages_form').serialize(true),
		function( results )
		{
			StandardCallback( results, 'locOutput' );
		}
		);
}

function SetAppDrmGuid( appid )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setdrmguid/' + appid, 
					$('drmguid_selection_form').serialize(true), 
					function(results ) 
					{
						StandardCallback(results, 'setguidoutput') ; 
					}
					) ; 
}

function UpdateCEGEnabledStatus( appid, enabledflag, versionset, uniqueid )
{
    
	AppsAjaxRequest( g_szBaseURL + '/apps/updatecegenabledstatus/' + appid,
					{ appid: appid, enabledflag: enabledflag, versionset: versionset},
					function(results )
					{
						StandardCallback(results, uniqueid) ;
					}
					) ;
}

function GetCEGPropStatus( versionset, appid, uniqueid )
{
    
	AppsAjaxRequest( g_szBaseURL + '/apps/getcegpropstatus/' + appid,
					{ versionset: versionset, appid: appid},
					function(results )
					{
						StandardCallback(results, uniqueid) ;
					}
					) ;
}


function AddGameAndChallengeGroup( appid, groupname )
{
    $('addgameandchallengegroupoutput').innerHTML = "Talking to Vac Server..."
	AppsAjaxRequest( g_szBaseURL + '/apps/addgameandchallengegroup/' + appid, 
					{ groupname: groupname },
					function(results ) 
					{
						RefreshCallback(results) ; 
					}
					) ; 
}

function AddChallengeForChallengeGroup( appid, groupid, challengetype )
{
    $('addchallengeforchallengegroupoutput').innerHTML = "Talking to Vac Server..."
	AppsAjaxRequest( g_szBaseURL + '/apps/addchallengeforchallengegroup/' + appid, 
					{ groupid: groupid, challengetype: challengetype },
					function(results ) 
					{
						RefreshCallback(results) ; 
					}
					) ; 
}

function AddModuleForChallengeGroup( appid, groupid, modulename )
{
    $('addmoduleforchallengegroupoutput').innerHTML = "Talking to Vac Server..."
	AppsAjaxRequest( g_szBaseURL + '/apps/addmoduleforchallengegroup/' + appid, 
					{ groupid: groupid, modulename: modulename },
					function(results ) 
					{
						RefreshCallback(results) ; 
					}
					) ; 
}

//
// achievements tab helper; fills in achievement
// localization counts
//
function LoadAchievementCounts( appid )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/getachievementcounts/' + appid,
		{},
		function( results )
		{
			var cAchievements = results[ 'total' ];
			$('achievementCount').innerHTML = cAchievements;
			delete results[ 'total' ];
			var unlocalized = results[ 'unlocalized' ];
			delete results[ 'unlocalized' ];
			
			if ( 0 && ( unlocalized[ 'descs' ] != 0 || unlocalized[ 'names' ] != 0 ) )
			{
				var elt = $( 'missing_unlocalized' );
				var text = '';
				if ( unlocalized[ 'names' ] )
				{
					text += unlocalized[ 'names' ].toString() + " names are completely unlocalized. ";
				}
				if ( unlocalized[ 'descs' ] )
				{
					text += unlocalized[ 'descs' ].toString() + " descriptions are completely unlocalized. ";
				}
				elt.innerHTML = text;
				elt.style.display = '';
				elt.className = "outputNeutral";
				
			}

			for ( lang in results )
			{
				var langName = g_rgLanguages[ lang ];
				if ( lang == 'token' )
					langName = 'localization tokens';
				var elt = $( 'missing_' + lang );
				
				if ( elt != null )
				{
					var text = '';
					var cNames = results[ lang ][ 'names' ];
					var cDescs = results[ lang ][ 'descs' ];
					
					if ( lang == "english" )
					{
						cNames += unlocalized[ 'names' ];
						cDescs += unlocalized[ 'descs' ];
					}
					
					if ( cNames < cAchievements )
					{
						text = "Missing " + ( cAchievements - cNames ) + " names in " + langName + ". ";
					}
					if ( cDescs < cAchievements )
					{
						text = text + "Missing " + ( cAchievements - cDescs ) + " descriptions in " + langName + ". ";
					}
	
					if ( text != '' )
					{
						elt.style.display = '';
						elt.innerHTML = text;
						elt.className = "outputNeutral";
					}
					else if ( lang != 'token' )
					{
						elt.style.display = '';
						elt.innerHTML = g_rgLanguages[ lang ] + " is fully localized.";
						elt.className = "outputSuccess";
					}
				}
			}
		}
		);
}

//
// cross-branch munging for admins
//
function CrossBranchApp( appid )
{
	if ( !confirm( "Perform cross-branch merge/checkin for this app?" ) )
	{
		return false;
	}
	
	AppsAjaxRequest(
		g_szBaseURL + '/apps/crossbranch/' + appid,
		{},
		function( results )
		{
			StandardCallback( results, 'appOutput' );
		}
		);
	
}

//
// community OGG form uploader
//
function CreateCommunityGroup( appid )
{
	if ( !confirm( "Create community group with this name and URL portion? This action is irrevocable." ) )
	{
		return false;
	}

	AppsAjaxRequest(
		g_szBaseURL + '/apps/createogg/' + appid,
		$('create_ogg').serialize( true ),
		function( results )
		{
			if ( results.success == false )
			{
				StandardCallback( results, "new_ogg_response" );
			}
			else
			{
				window.location.reload( true );
			}
		}
		);
}

function CancelEvent( event )
{
	if ( !event ) var event = window.event;
	
	event.cancelBubble = true;
	if ( event.stopPropagation ) event.stopPropagation();
}

//
// Get leaderboard entries
// element - ID of element to update with progress & results
// template - html template for each row
// dataRequest - 0 = global, 1 = global around specified user, 2 = friends of user
// onReceivedEntries - callback reporting new total entries in leaderboard (params: leaderboardid, totalCount) 
//
function GetLeaderboardEntries( target, template, onReceivedEntries, appid, leaderboardid, dataRequest, rangeStart, rangeEnd, steamid )
{
	var element = $( target );
	element.innerHTML = 'Loading...';
	
	AppsAjaxRequest(
		g_szBaseURL + '/apps/getleaderboardentries/' + appid,
		{
			'leaderboardid' : leaderboardid,
			'dataRequest' : dataRequest,
			'rangeStart' : rangeStart,
			'rangeEnd' : rangeEnd,
			'steamid' : steamid
		},
		function ( results )
		{
			if ( !results[ 'success' ] )
			{
				element.innerHTML = 'Unable to load entries';
				return;
			}
			
			if ( results[ 'entries' ].length == 0 )
			{
				element.innerHTML = 'No entries in this leaderboard';
				return;
			}
			
			element.innerHTML = '';			
			for (var i = 0; i < results[ 'entries' ].length; i++)
			{
				var rank = results['entries'][i]['rank'];
				var steamid = results['entries'][i]['steamid'];
				var score = results['entries'][i]['score'];
				var personaname = results['entries'][i]['personaname'];
				var details = results['entries'][i]['details'];
				
				var deletename = personaname.replace( /'/g, "\\'" );
				var html = template.evaluate( { score: score, steamid: steamid, rank: rank, leaderboardid: leaderboardid, personaname: personaname, details: details, deletename: deletename } );
				element.insert( html );
			}
			
			onReceivedEntries( leaderboardid, results['totalEntries'] );
		}
		);
}

//
// Draws a page control the target element
//
// Params:
// target - element to set html for
// onChange - function called when user clicks a page link [def: onChange( context, page ) ]
// context - passed as first param to onChange
// currentPage - selected page
// maxPage - last page that can be selected. If 0, target is left blank
// 
function RenderPageControl( target, onChange, context, currentPage, maxPage )
{
	// special case for no results found
	if ( maxPage == 0 )
	{
		$( target ).innerHTML = '';
		return;
	}
		
	// setup config	
	var startEllipsis = false;
	var startPage = 1;
	var endEllipsis = false;
	var endPage = maxPage;
	
	if ( maxPage > 7 )
	{
		if ( currentPage - 3 > 1 )
		{
			startEllipsis = true;
			startPage = currentPage - 2;
		}
		
		if ( currentPage + 3 < maxPage )
		{
			endEllipsis = true;
			endPage = currentPage + 2;
		}		
	}
	
	function CreateLink( page, inner )
	{
		return '<a href="javascript:' + onChange + '( ' + context + ', ' + page + ');">' + inner + '</a>';
	}
	
	// build HTML
	var html = '';
	if ( currentPage > 1 )
		html += CreateLink( currentPage - 1, "&lt;&lt;" ) + ' ';
	
	html += 'Page: ';
	
	if ( startEllipsis )
		html += CreateLink( 1, 1 ) + ' &nbsp;...&nbsp; ';
	
	for ( var i = startPage; i <= endPage; i++ )
	{
		if ( i > startPage )
		{
			html += '&nbsp;|&nbsp;';
		}
		if ( i == currentPage )
		{
			html += i;
		}
		else 
		{
			html += CreateLink( i, i );
		}
	}
	
	if ( endEllipsis )
	{
		html += ' &nbsp;...&nbsp; ' + CreateLink( maxPage, maxPage );
	}
	
	if ( currentPage < maxPage )
	{
		html += ' ' + CreateLink( currentPage + 1, '&gt;&gt;' );
	}
	
	// set it
	$( target ).innerHTML = html;
}

function DeleteLeaderboardEntry( onDelete, appid, leaderboardid, steamid, personaname )
{
	if ( !confirm( 'Are you sure you want to delete the leaderboard entry for: ' + personaname + '?' ) )
		return;
		
	AppsAjaxRequest(
		g_szBaseURL + '/apps/deleteleaderboardentry/' + appid,
		{
			'leaderboardid' : leaderboardid,			
			'steamid' : steamid
		},
		function ( results )
		{
			if ( !results[ 'success' ] )
			{
				alert( results['message'] );				
			}
			
			onDelete( leaderboardid );			
		}
		);	
}


//
// Change community settings
//
function SetAppCommunityFriendlyName( appid, friendlyname )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setcommunityfriendlyname/' + appid,
		{ 'friendlyname' : friendlyname },
		function(results) {
			if ( StandardCallback( results, 'community_stats_save_output' ) )
			{
				if ( friendlyname )
					$('community_friendly_name_clear_btn').show();
				else
					$('community_friendly_name_clear_btn').hide();
			}
		}
	);
}

function SetAppCommunityStatsHidden( appid, statshidden )
{
	AppsAjaxRequest( g_szBaseURL + '/apps/setcommunitystatshidden/' + appid,
		{ 'statshidden' : statshidden },
		function(results) { StandardCallback( results, 'community_stats_save_output' ); }
	);
}


function DisplayDivOnClick( button, div )
{
	if ( $(button) )
		$(button).hide();

	if ( $(div) )
		new Effect.BlindDown( $(div), {duration: 0.25} );
}

//
// Tags
//
function AddTagCategory( tagCategories )
{
	var parent = $( tagCategories );
	var index = parent.children.length;
	var arrayKey = tagCategories + '[' + index + ']';
	var div = new Element( 'div', { 'id' : tagCategories + '_' + index } );
	div.innerHTML = "New - Category Name (can be empty):";
	var inputEnglish = new Element( 'input', { 'name': arrayKey + '[english]' } );
	div.appendChild( inputEnglish );
	var inputHTMLElement = new Element( 'input', { 'name' : arrayKey + '[htmlelement]', 'type' : 'hidden', 'value' : 'checkbox' } );
	div.appendChild( inputHTMLElement );
	parent.appendChild( div );
	$('TagsForm').submit();
}

function RemoveTagCategory( id )
{
	$( id ).remove();
	$('TagsForm').submit();
}

function RemoveTag( tagID )
{
	$( tagID ).remove();
	$('TagsForm').submit();
}

function AddTag( htmlID, addTagButton, tagCategories, category )
{
	var parent = $( tagCategories + '_' + category );
	var index = parent.children.length;
	var name = tagCategories + '[' + category + '][tags][' + index + ']';
	var input = new Element( 'input', { 'name' : name, 'id' : name } );

	parent.appendChild( new Element( 'br' ) );
	var span = new Element( 'span' );
	span.innerHTML = "New:&nbsp;";
	parent.insertBefore( span, $( addTagButton ) );
	parent.insertBefore( input, $( addTagButton ) );
	parent.insertBefore( new Element( 'br' ), $( addTagButton ) );
}

function OnChangeTagCategoryType( htmlID )
{
	var selectOption = $( htmlID + '[htmlelement]' );
	if ( selectOption.value == 'external_url' )
	{
		$( htmlID + '[external_url_container]' ).show();
	}
	else
	{
		$( htmlID + '[external_url_container]' ).hide();
	}
}

function UpdateReleaseRequest( nAppId, rgChanges )
{
	$J.ajax({
		url: 'https://partner.steamgames.com/apps/ajaxupdatereleaserequest/' + nAppId,
		cache: false,
		type: "POST",
		data: rgChanges,
		error: function() {
			alert("Unknown error. Changes have not been saved.");
		},
		success: function( response )
		{
			//console.log(response);
			location.reload();
		}
	});
}



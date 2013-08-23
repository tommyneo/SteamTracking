
function ShowDefaultGiftOptions( gidGift )
{
	var elStepInit = $('gift' + gidGift + '_step_init');
	var elStepAccept = $('gift' + gidGift + '_step_accept');

	elStepInit.show();
	elStepAccept.hide();
}

function ShowAcceptGiftOptions( gidGift )
{
	var elStepInit = $('gift' + gidGift + '_step_init');
	var elStepAccept = $('gift' + gidGift + '_step_accept');

	elStepInit.hide();
	elStepAccept.show();
}

function ShowDeclineGiftOptions( event, gidGift )
{
	if (!event) event = window.event;
	Event.stop( event );
	showContentAsModal( 'gift_modal', $('decline_gift_prompt_' + gidGift ) );
}

function UnpackGift( gidGift )
{
	var action = 'validateunpack';

	new Ajax.Request( 'http://steamcommunity.com/gifts/' + gidGift + '/' + action, {
		method: 'post',
		parameters: { sessionid: g_sessionID },
		onSuccess: function( transport ) { OnValidateUnpackResults( gidGift, transport ); },
		onFailure: function( transport ) { ShowGiftModalError( 'Unable to add the gift to your game library.  The gift may have already been redeemed.  Please try again later.' ); }
	} );
}

function OnValidateUnpackResults( gidGift, transport )
{
	var idUnpackResults = 'unpack_validate_results_' + gidGift;
	var elUnpackResults = $(idUnpackResults);
	if ( !elUnpackResults )
	{
		var elUnpackResults = new Element( 'div', { id: idUnpackResults } );
	}
	elUnpackResults.update( transport.responseJSON.message );
	showContentAsModal( 'gift_modal', elUnpackResults, true );
}

function DoUnpackGift( gidGift, packageid, packagename )
{
	var elUnpackGiftButtons = $('unpack_gift_buttons_' + gidGift);
	if ( elUnpackGiftButtons )
		ShowWaiting( gidGift, elUnpackGiftButtons,  $('unpack_gift_buttons_' + gidGift + '_wait') );

	var action = 'unpack';

	new Ajax.Request( 'http://steamcommunity.com/gifts/' + gidGift + '/' + action, {
		method: 'post',
		parameters: { sessionid: g_sessionID },
		onComplete: function( transport ) { OnUnpackGiftResults( gidGift, packageid, packagename, transport ); }
	} );
}

function DeleteGift( gidGift )
{
	ShowConfirmDialog(
			'Delete gift',
			'Are you sure you want to permanently delete this gift?',
			'Delete gift',
			'Cancel'
	).done( function() {
		new Ajax.Request( 'http://steamcommunity.com/gifts/' + gidGift + '/' + 'delete', {
			method: 'post',
			parameters: { sessionid: g_sessionID },
			onSuccess: function( transport ) { OnDeleteGiftResults( gidGift, transport ); },
			onFailure: function( transport ) { ShowGiftModalError( 'Unable to delete the gift from your game library.  The gift may have already been deleted or redeemed.  Please try again later.' ); }
		} );
	} );
}

function OnDeleteGiftResults( gidGift, transport )
{
	if ( transport.responseJSON && transport.responseJSON.success == 1 )
	{
		UserYou.ReloadInventory( 753, 1 );
	}
	else
	{
		ShowGiftModalError( 'Unable to delete the gift from your game library.  The gift may have already been deleted or redeemed.  Please try again later.' );
	}
}

function DoAcceptGift( gidGift, bUnpack )
{
	ShowWaiting( gidGift, $('gift' + gidGift + '_step_accept'),  $('gift' + gidGift + '_step_wait') );

	var action = bUnpack ? 'acceptunpack' : 'accept';

	new Ajax.Request( 'http://steamcommunity.com/gifts/' + gidGift + '/' + action, {
		method: 'post',
		parameters: { sessionid: g_sessionID },
		onComplete: function( transport ) { OnAcceptGiftResults( gidGift, bUnpack, transport ); }
	} );
}

function DoDeclineGift( gidGift, steamidSender )
{
	var elDeclineGiftButtons = $('decline_gift_buttons_' + gidGift);

	ShowWaiting( gidGift, elDeclineGiftButtons,  $('gift' + gidGift + '_decline_wait') );

	var action = 'decline';

	new Ajax.Request( 'http://steamcommunity.com/gifts/' + gidGift + '/' + action, {
		method: 'post',
		parameters: { sessionid: g_sessionID, steamid_sender: steamidSender },
		onComplete: function( transport ) { OnDeclineGiftResults( gidGift, transport ); }
	} );
}

function OnAcceptGiftResults( gidGift, bUnpack, transport )
{
	if ( UserYou )
	{
		// reload the user's gift inventory so they see any changes made here
		UserYou.ReloadInventory( 753, 1 );
	}
	if ( transport.responseJSON && transport.responseJSON.success == 1 )
	{
		if ( bUnpack )
		{
			ClearGiftWithMessage( gidGift, $('unpacked_gift_' + gidGift) );
		}
		else
		{
			ShowAcceptedGiftMessage( gidGift, transport.responseJSON.gidgiftnew );
		}
		RefreshNotificationArea();
	}
	else
	{
		$('gift' + gidGift + '_step_accept').show();
		$('gift' + gidGift + '_step_wait').hide();
		ShowDefaultGiftOptions( gidGift );

		ShowUnpackError( gidGift, bUnpack, transport );
	}
}

function ShowUnpackError( gidGift, bUnpack, transport )
{
	var response = transport.responseJSON;
	var strError = bUnpack ? 'Unable to add the gift to your game library.  The gift may have already been redeemed.  Please try again later.' : 'Unable to accept gift.  The gift may have already been redeemed.  Please try again later.';
	var strDetails = false;
	if ( response && response.error )
	{
		strError = response.error;
	}
	if ( response && response.accepted )
	{
		strDetails = 'This game has not been added to your game library.  It will be stored in your inventory, to be traded or added to library later.';
		if ( response.gidgiftnew )
			ShowAcceptedGiftMessage( gidGift, response.gidgiftnew );
	}
	ShowGiftModalError( strError, strDetails );
}

function OnUnpackGiftResults( gidGift, packageid, packagename, transport )
{
	if ( transport.responseJSON && transport.responseJSON.success == 1 )
	{
		if ( UserYou )
		{
			// reload the user's gift inventory so they see any changes made here
			UserYou.ReloadInventory( 753, 1 );
		}

		if ( $('gift_unpack_install_modal_installbtn' ) )
		{
			if ( packageid == 15479 )
				$('gift_unpack_install_modal_installbtn').hide();
			else
			{
				$('gift_unpack_install_modal_installbtn').show();
				$('gift_unpack_install_modal_installbtn').href = 'steam://subscriptioninstall/' + packageid;
			}
		}

		if ( $('gift_unpack_install_packagename') )
			$('gift_unpack_install_packagename').update( packagename );

		showContentAsModal( 'gift_modal', $('gift_unpack_install_modal') );
		RefreshNotificationArea();
	}
	else
	{
		ShowUnpackError( gidGift, true, transport );
	}
}

function ShowAcceptedGiftMessage( gidGift, gidGiftNew )
{
	var elLink = $('accepted_gift_link_' + gidGift );
	elLink.href = elLink.href + '#753_1_' + gidGiftNew;
	ClearGiftWithMessage( gidGift, $('accepted_gift_' + gidGift) );
}

function OnDeclineGiftResults( gidGift, transport )
{
	if ( transport.responseJSON && transport.responseJSON.success == 1 )
	{
		hideModal( 'gift_modal' );
		ClearGiftWithMessage( gidGift, $('declined_gift_' + gidGift) );
		RefreshNotificationArea();
	}
	else
	{
		ShowDefaultGiftOptions( gidGift );
		ShowGiftModalError( 'Unable to decline gift.  The gift may have already been declined or redeemed.' );
	}

	// reset the buttons in the decline gift popup
	$('gift' + gidGift + '_decline_wait').hide();
	$('decline_gift_buttons_' + gidGift).show();
}

function ClearGiftWithMessage( gidGift, elMessage )
{
	new Effect.BlindDown( $(elMessage), {duration: 0.5 } );
	new Effect.BlindUp( $('pending_gift_' + gidGift), {duration: 0.5 } );
}

function ShowWaiting( gidGift, elCurrentControls, elStepWait )
{
	elStepWait.style.height = elCurrentControls.getHeight() + 'px';
	elStepWait.style.lineHeight = elCurrentControls.getHeight() + 'px';
	elCurrentControls.hide();
	elStepWait.show();
}

function ShowGiftModalError( strError, strDetails )
{
	$('gift_error_modal_message').update( strError );
	$('gift_error_modal_details').update( strDetails ? strDetails : '&nbsp;' );
	showContentAsModal( 'gift_modal', $('gift_error_modal_content' ) );
}

function ShowGiftModalSuccess( strMessage, strDetails )
{
	$('gift_success_modal_message').update( strMessage );
	$('gift_success_modal_details').update( strDetails ? strDetails : '&nbsp;' );
	showContentAsModal( 'gift_modal', $('gift_success_modal_content' ) );
}

function ShowGiftHistory()
{
	if ( $('no_pending_gifts_msg') )
		new Effect.BlindUp( $('no_pending_gifts_msg'), {duration: 0.25 } );
	if ( $('gift_history_link') )
		$('gift_history_link').hide();
	$('gift_history').show();

	new Ajax.Updater(
		'gift_history_content',
		'http://steamcommunity.com/gifts/0/history/',
		{ method: 'get' }
	);
}
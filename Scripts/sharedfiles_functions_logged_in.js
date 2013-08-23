
// I know what you're thinking. No, it won't work.
function WorkshopSetAccepted(item_id)
{
	if(!confirm("Are you sure you want to promote this item to Accepted? This is difficult to undo and should only be done" +
		"if you are REALLY REALLY sure you want to do this."))
		return;

	var options = {
		method: 'post',
		postBody: 'id=' + item_id + '&sessionid=' + g_sessionID,
		onComplete: (function(item_id){
			return function(transport)
			{
				window.location.reload();
			}
		}(item_id))
	};
	new Ajax.Request(
		'http://steamcommunity.com/sharedfiles/setaccepted',
		options
	);
}

// Still won't work.
function WorkshopSetPending(item_id)
{
	if(!confirm("Are you sure you want to promote this item to Pending? This is difficult to undo and should only be done" +
		"if you are REALLY REALLY sure you want to do this."))
		return;

	var options = {
		method: 'post',
		postBody: 'id=' + item_id + '&sessionid=' + g_sessionID,
		onComplete: (function(item_id){
			return function(transport)
			{
				window.location.reload();
			}
		}(item_id))
	};
	new Ajax.Request(
		'http://steamcommunity.com/sharedfiles/setpending',
		options
	);
}

function CheckVoteResults( transport )
{
	var json = transport.responseText.evalJSON();
	return CheckVoteResultsJSON( json );
}

function CheckVoteResultsJSON( json )
{
	switch ( json['success'] )
	{
		case 16:
			alert( 'There was a problem submitting your request to our servers. Please try again.' );
			return false;
		case 24:
			alert( 'Your account does not have sufficient privileges to perform this action. To access all features of Steam, simply purchase a game from the Steam store, redeem a Gift on Steam, complete a microtransaction, or activate a retail game on Steam.' );
			return false;
		case 21:
			alert( 'You must be logged in to perform that action.' );
			return false;
		case 1:
			return true;
		default:
			alert( 'There was a problem submitting your request.' );
			return false;
	}
}

function VoteUp(item_id)
{
	if ( !$('VoteUpBtn').hasClassName( 'toggled' ) )
	{
		$('action_wait').show();
		var options = {
			method: 'post',
			postBody: 'id=' + item_id + '&sessionid=' + g_sessionID,
			onSuccess: (function(item_id){
				return function(transport)
				{
					$('action_wait').hide();

					if ( !CheckVoteResults( transport ) )
						return;

					var votesUpCount = $('VotesUpCount');
					if ( votesUpCount )
					{
						votesUpCount.innerHTML = parseInt( votesUpCount.innerHTML ) + 1;
						$('VotesUpCountContainer').show();
					}

					$('VoteUpBtn').addClassName('toggled');
					$('VoteDownBtn').removeClassName('toggled');
					$('VoteLaterBtn').hide();

					var blurb = $('rated_blurb');
					if( blurb != null )
						blurb.show();

					var next = $('voteNext');
					if( next != null )
						next.show();
				}
			}(item_id))
		};
		new Ajax.Request(
			'http://steamcommunity.com/sharedfiles/voteup',
			options
		);
	}
	return false;
}

function VoteDown(item_id)
{
	if ( !$('VoteDownBtn').hasClassName( "toggled" ) )
	{
		var blurb = $('rated_blurb');
		if( blurb != null )
			blurb.hide();

		$('action_wait').show();

		var options = {
			method: 'post',
			postBody: 'id=' + item_id + '&sessionid=' + g_sessionID,
			onSuccess: (function(item_id){
				return function(transport)
				{
					$('action_wait').hide();

					if ( !CheckVoteResults( transport ) )
						return;

					var votesUpCount = $('VotesUpCount');
					if ( votesUpCount && $('VoteUpBtn').hasClassName( 'toggled' ) )
					{
						votesUpCount.innerHTML = parseInt( votesUpCount.innerHTML ) - 1;
						if ( parseInt( votesUpCount.innerHTML ) == 0 )
						{
							$('VotesUpCountContainer').hide();
						}
					}
					$('VoteUpBtn').removeClassName('toggled');
					$('VoteDownBtn').addClassName('toggled');
					$('VoteLaterBtn').hide();

					var next = $('voteNext');
					if( next != null )
						next.show();
				}
			}(item_id))
		};
		new Ajax.Request(
			'http://steamcommunity.com/sharedfiles/votedown',
			options
		);
	}

	return false;
}

function VoteLater(item_id)
{
	if ( !$('VoteLaterBtn').hasClassName( "toggled" ) )
	{
		var blurb = $('rated_blurb');
		if( blurb != null )
			blurb.hide();

		$('action_wait').show();

		var options = {
			method: 'post',
			postBody: 'id=' + item_id + '&sessionid=' + g_sessionID,
			onSuccess: (function(item_id){
				return function(transport)
				{
					$('action_wait').hide();

					if ( !CheckVoteResults( transport ) )
						return;

					$('VoteLaterBtn').addClassName('toggled');

					var next = $('voteNext');
					if( next != null )
						next.show();
				}
			}(item_id))
		};
		new Ajax.Request(
			'http://steamcommunity.com/sharedfiles/votelater',
			options
		);
	}

	return false;
}

function ReportItem()
{
	if ( $('ReportItemBtn') && $('ReportItemBtn').hasClassName( "toggled" ) )
		return;

	var dialog = ShowPromptWithTextAreaDialog( 'Report this item', '', null, null, 1000 );
	var explanation = $J('<div/>', { 'class': 'report_dialog_explanation' } );
	explanation.html( 'Please enter the reason why you are reporting this item for violating the Steam Terms of Service. This cannot be undone.' );

	var dmcaLink = $J('<div/>', { 'class': 'report_dialog_explanation' } );
	dmcaLink.html( 'If you\'d like to report Copyright Infringement and are the copyright holder, please proceed to our DMCA compliant notice of copyright infringement form <a href="http://steamcommunity.com/dmca/create/" target="_blank">here</a>.' );
	var actualLink = dmcaLink.find( "a" )[0];
	actualLink.href += publishedfileid;

	var textArea = dialog.m_$Content.find( 'textarea' );
	textArea.addClass( "report_dialog_text_area" );
	textArea.parent().before( explanation );
	textArea.parent().after( dmcaLink );

	dialog.done( function( data ) {
		data = v_trim( data );
		if ( data.length < 1 )
		{
			alert( 'Please enter a valid reason.')
			return;
		}
		$J.post( 'http://steamcommunity.com/sharedfiles/reportitem', {
				'id' : publishedfileid,
				'description' : data,
				'sessionid' : g_sessionID
			}
		).done( function( json ) {
				if ( !CheckVoteResultsJSON( json ) )
					return;

				$('ReportItemBtn').className = "general_btn report toggled";
		} );
	} );
}

function HideSharePoup()
{
	$('SharePopup').hide();
	$('ShareItemBtn').removeClassName( 'toggled' );
}

function SubscribeItem()
{
	$('action_wait').show();
	if ( !$('SubscribeItemBtn').hasClassName( "toggled" ) )
	{
		$('PublishedFileSubscribe').request( {
			onComplete: function()
			{
				$('JustSubscribed').show();
				$('SubscribeItemBtn').addClassName("toggled");
				$('SubscribeItemOptionAdd').className = "subscribeOption add";
				$('SubscribeItemOptionSubscribed').className = "subscribeOption subscribed selected";
				$('action_wait').hide();
			}
		} );
	}
	else
	{
		$('PublishedFileUnsubscribe').request( {
			onComplete: function()
			{
				$('JustSubscribed').hide();
				$('SubscribeItemBtn').removeClassName("toggled");
				$('SubscribeItemOptionAdd').className = "subscribeOption add selected";
				$('SubscribeItemOptionSubscribed').className = "subscribeOption subscribed";
				$('action_wait').hide();
			}
		} );
	}
}

function FavoriteItem()
{
	$('action_wait').show();
	if ( !$('FavoriteItemBtn').hasClassName( "toggled" ) )
	{
		$('PublishedFileFavorite').request( {
			onComplete: function()
			{
				$('JustFavorited').show();
				$('FavoriteItemBtn').className = "general_btn favorite toggled";
				$('FavoriteItemOptionAdd').className = "favoriteOption addfavorite";
				$('FavoriteItemOptionFavorited').className = "favoriteOption favorited selected";
				$('action_wait').hide();
			}
		} );
	}
	else
	{
		$('PublishedFileUnfavorite').request( {
			onComplete: function()
			{
				$('JustFavorited').hide();
				$('FavoriteItemBtn').className = "general_btn favorite";
				$('FavoriteItemOptionAdd').className = "favoriteOption addfavorite selected";
				$('FavoriteItemOptionFavorited').className = "favoriteOption favorited";
				$('action_wait').hide();
			}
		} );
	}
}

function FollowItem(item_id, app_id)
{
	$('action_wait').show();

	var bShouldFollow = !$('FollowItemBtn').hasClassName('toggled');

	var options = {
		method: 'post',
		parameters: {
			'id' : item_id,
			'appid' : app_id,
			'sessionid' : g_sessionID,
			'follow' : bShouldFollow ? '1' : '0'
		},
		onSuccess: (function(item_id){
			return function(transport)
			{
				$('action_wait').hide();

				if ( !CheckVoteResults( transport ) )
					return;

				if ( bShouldFollow )
				{
					$('FollowItemBtn').addClassName('toggled');
					$('FollowItemOptionAdd').removeClassName('selected');
					$('FollowItemOptionFollowed').addClassName('selected');
				}
				else
				{
					$('FollowItemBtn').removeClassName('toggled');
					$('FollowItemOptionAdd').addClassName('selected');
					$('FollowItemOptionFollowed').removeClassName('selected');
				}
			}
		}(item_id))
	};
	new Ajax.Request(
		'http://steamcommunity.com/sharedfiles/followitem',
		options
	);
}

function CloseNotification( notification )
{
	$( notification ).hide();
}

function SubscribeCollectionItem( id, appID )
{
	$('action_wait_' + id).show();
	if ( !$('SubscribeItemBtn' + id ).hasClassName( "toggled" ) )
	{
		$('PublishedFileSubscribe').id.value = id;
		$('PublishedFileSubscribe').appid.value = appID;
		$('PublishedFileSubscribe').request( {
			onComplete: function()
			{
				$('JustSubscribed').show();
				$('SubscribeItemBtn' + id).className = "general_btn subscribe toggled";
				$('action_wait_' + id).hide();
			}
		} );
	}
	else
	{
		$('PublishedFileUnsubscribe').id.value = id;
		$('PublishedFileUnsubscribe').appid.value = appID;
		$('PublishedFileUnsubscribe').request( {
			onComplete: function()
			{
				$('JustSubscribed').hide();
				$('SubscribeItemBtn' + id).className = "general_btn subscribe";
				$('action_wait_' + id).hide();
			}
		} );
	}
}

function SetImageDimensionsForFile( fileID, elemIDImageWidth, elemIDImageHeight, elemIDImage )
{
	if ( typeof FileReader !== "undefined" )
	{
		var file = $( fileID ).files[0];
		var reader = new FileReader();
		reader.onload = (function(f) {
			return function() {
				var i = new Image();
				i.onload = (function(e) {
					var height, width;
					width = e.target.width;
					height = e.target.height;
					$( elemIDImageWidth ).value = width;
					$( elemIDImageHeight ).value = height;
					var pageImage = $( elemIDImage );
					if ( pageImage )
					{
						pageImage.src = i.src;
					}
				});
				return i.src = reader.result;
			};
		})(file);
		return reader.readAsDataURL(file);
	}
}

function ShowAddToCollection( id, appID )
{
	// hide children
	$J( '#AddToCollectionDialogNoEligibleCollections' ).hide();
	var $dialogContents = $J( '#AddToCollectionDialogContents' );
	$dialogContents.hide();
	$J('#AddToCollectionDialogLoading').show();

	// show dialog
	$( 'AddToCollectionDialog' ).show();
	var dialog = ShowConfirmDialog( 'Add to Collection', $( 'AddToCollectionDialog' ) );
	dialog.SetRemoveContentOnDismissal( false );

	// we want to check what was in the array for sending diffs
	var set_parent_collections = new Array();

	// function for when the user clicks OK
	dialog.done( function() {
		var params = {
			'sessionID' : g_sessionID,
			'publishedfileid' : id
		};

		var $inputs = $J( '.add_to_collection_dialog_checkbox' );
		for ( var i = 0; i < $inputs.length; ++i )
		{
			var $input = $inputs[i];
			var publishedFileID = $input.id;
			if ( set_parent_collections[publishedFileID] === "in_collection" )
			{
				if ( !$input.checked )
				{
					params['collections[' + publishedFileID + '][remove]'] = true;
				}
			}
			else
			{
				if ( $input.checked )
				{
					params['collections[' + publishedFileID + '][add]'] = true;
				}
			}
		}

		$J.post( 'http://steamcommunity.com/sharedfiles/ajaxaddtocollections',
			params
		).done( function( data ) {
				dialog.Dismiss();
			}).fail( function( jqxhr ) {
				dialog.Dismiss();
				ShowAlertDialog( 'Add to Collection', 'Failed! Message: ' + data.success );
			});
		}
	);

	// ajax request to get the user's collections
	$J.post( 'http://steamcommunity.com/sharedfiles/ajaxgetmycollections', {
		'appid' : appID,
		'publishedfileid' : id,
		'sessionid' : g_sessionID
		}
	).done( function( json ) {
		$J('#AddToCollectionDialogLoading').hide();

		if ( json['success'] != 1 )
		{
			alert( 'Failure: ' + json['success'] );
			return;
		}

		var numAdded = 0;
		$dialogContents.empty();

		var all_collections = json['all_collections'];
		var parent_collections = json['parent_collections'];

		// create a set we can quickly look at
		if ( 'publishedfiledetails' in parent_collections )
		{
			var publishedFileDetails = parent_collections['publishedfiledetails'];
			for ( var i = 0; i < publishedFileDetails.length; ++i )
			{
				var details = publishedFileDetails[i];
				set_parent_collections[details['publishedfileid']] = 'in_collection';
			}
		}

		// now create the list
		if ( 'publishedfiledetails' in all_collections )
		{
			var publishedFileDetails = all_collections['publishedfiledetails'];
			for ( var i = 0; i < publishedFileDetails.length; ++i )
			{
				var details = publishedFileDetails[i];
				var publishedFileID = details['publishedfileid'];
				// don't allow the current item if it is a collection
				if ( details['result'] != 1 || publishedFileID == id )
				{
					continue;
				}
				var $container = $J('<div/>', {'class': 'add_to_collection_dialog_container'} );
				var $input = $J('<input/>', {'type' : 'checkbox', 'class': 'add_to_collection_dialog_checkbox', 'name' : 'collections[' + publishedFileID + ']', 'id' : publishedFileID } );
				if ( set_parent_collections[publishedFileID] === "in_collection" )
				{
					$input.prop( 'checked', true );
				}
				$container.append( $input );
				var $title = ( $J('<label/>', {'class': 'add_to_collection_dialog_title', 'for' : publishedFileID } ).append( details['title'] ) );
				$container.append( $title );
				$dialogContents.append( $container );
				numAdded++;
			}
		}
		if ( numAdded == 0 )
		{
			$( 'AddToCollectionDialogNoEligibleCollections' ).show();
		}
		else
		{
			ShowWithFade( 'AddToCollectionDialogContents' );
		}
	} );
}

function RemoveTaggedUser( publishedfileid, accountid )
{
	ShowConfirmDialog( 'Are you sure?', 'You are about to remove yourself as being tagged in this screenshot.  Are you sure?', 'Remove', 'Cancel'
	).done( function() {
		$J.post( 'http://steamcommunity.com/sharedfiles/removetaggeduser', {
			'accountid': accountid,
			'publishedfileid' : publishedfileid,
			'sessionid' : g_sessionID
			}
		).done( function( json ){
			jQuery("#friendLink_" + accountid ).remove();
		})
	});
}


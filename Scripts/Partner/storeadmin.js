
function UpdateMetacriticLink( name, metacritic )
{
	var elemMetacritic = $(metacritic);
	if ( g_rgMetacriticURLs && g_rgMetacriticURLs[name] )
	{
		elemMetacritic.href = g_rgMetacriticURLs[name];
		elemMetacritic.show();
	}
	else
	{
		elemMetacritic.hide();
	}
}

function OnBlurMetacritic( name )
{
	if ( g_rgMetacriticURLs && g_rgMetacriticURLs[name] )
		return;

	// invalid metacritic name.. clear
	$( 'app_game_metacritic_metacritic_name__target' ).value = '';
	$( 'app_game_metacritic_metacritic_name__compl' ).value = '';
	UpdateMetacriticLink( '', 'metacritic_link' );

}

function UpdateAdminLink( elem, urlpath, value )
{
	var elemLink = $(elem);
	if ( value )
	{
		elemLink.href = g_szBaseUrl  + urlpath + value;
		elemLink.show();
	}
	else
	{
		elemLink.hide();
	}
}

function OnFreeGameCheck( checkbox, appid )
{
	if ( checkbox.value )
	{
		$('alt_appid_input').value = appid;
		new Effect.BlindDown( 'free_game_settings', {duration: 0.25} );
	}
	else
	{
		$('alt_appid_input').value = '';
		new Effect.BlindUp( 'free_game_settings', {duration: 0.25} );
	}
}

function PopulatePackageAppLists( rgIncludedItemIds, rgGiftableItemIds )
{
	var elemAllApps = $('package_available_app_list');
	var elemIncludedApps = $('package_included_app_list');
	
	// is the list of included apps an empty array?
	if ( rgIncludedItemIds.size && rgIncludedItemIds.size() == 0 )
		return;

	rgIncludedItemIds.each(function(itemId, index) {

		var opt = new Element('option', {value: itemId, 'class': g_rgReferencedItems[itemId]['cssClass'] } );
		opt.innerHTML = g_rgReferencedItems[itemId]['name'];
		if ( rgGiftableItemIds[itemId] )
			opt.addClassName( 'giftable' );
		elemIncludedApps.appendChild(opt);
	});
}

function PopulatePackageListsAJAX( elemAutoCompleteName, elemListName, packageCollection, grantor )
{
	var matchText = $J( "#" + elemAutoCompleteName ).val();

	if ( matchText.length < 3 )
		return;

	var params = {
		term : matchText
	};
	new Ajax.Request( 'https://partner.steamgames.com/admin/store/suggestpackagejson/', {
		method: 'post',
		parameters: params,
		onSuccess: function( transport ) {
			var matchingItems = transport.responseJSON || [];
			var list = $J( "#" + elemListName );
			list.find("option").remove();
			for ( var i = 0; i < matchingItems.length; ++i )
			{
				var option = matchingItems[i];
				var name = option['name'];
				if ( option['notes'] )
				{
					name += " [" + option['notes'] + "]";
				}
				list.append( $J('<option>', { 'class' : option['cssClass'], value : option['packageid'], text : name } ) );
			}
		}
	} );
}

function PopulateItemListAJAX( elemAutoCompleteName, elemListName, packageCollection, grantor )
{
	var matchText = $J( "#" + elemAutoCompleteName ).val();

	if ( matchText.length < 3 )
		return;

	var params = {
		term : matchText
	};
	new Ajax.Request( 'https://partner.steamgames.com/admin/store/suggestitemjson/', {
		method: 'post',
		parameters: params,
		onSuccess: function( transport ) {
			var matchingItems = transport.responseJSON || [];
			var list = $J( "#" + elemListName );
			list.find("option").remove();
			for ( var i = 0; i < matchingItems.length; ++i )
			{
				var option = matchingItems[i];
				var name = option['name'];
				if ( option['notes'] )
				{
					name += " [" + option['notes'] + "]";
				}
				list.append( $J('<option>', { 'class' : option['cssClass'], value : option['itemid'], text : name } ) );
			}
		}
	} );
}

function AjaxPopulateClusterList( elemValue, elemListID, clusterName, clusterType )
{
	var matchText = elemValue;

	var params = {
		term : matchText,
		type : clusterType
	}
	new Ajax.Request( 'https://partner.steamgames.com/admin/store/suggestclusteritemsjson/', {
		method: 'post',
		parameters: params,
		onSuccess: function( transport ) {
			var matchingItems = transport.responseJSON || [];
			var list = $J( "#" + elemListID );
			list.find("div").remove();
			for ( var i = 0; i < matchingItems.length; ++i )
			{
				var option = matchingItems[i];
				var name = option['name'];

				var newElement = null;
				if ( option['packageid'] )
				{
					newElement = $J('<div/>', {id: clusterName + '_clusterpackage_' + option['packageid'], 'class': option['cssClass'], text : name } );
				}
				else if ( option['itemid'] )
				{
					newElement = $J('<div/>', {id: clusterName + '_clusteritem_' + option['itemid'], 'class': option['cssClass'], text : name } );
				}
				if ( newElement )
				{
					list.append( newElement );
				}
			}
		}
	} );
}

function PopulateClusterLists( rgIncludedItems, clusterName, elemAvailableList, elemIncludedList, clusterType )
{
	var elemAllApps = $(elemAvailableList);
	var elemIncludedApps = $(elemIncludedList);
	
	var rgIncludedItemIds = {};
	var rgIncludedPackageIds = {};
	if ( rgIncludedItems )
	{
		rgIncludedItems.each( function ( rgItem ) { 
			if ( rgItem.itemid ) 
				rgIncludedItemIds[ rgItem.itemid ] = true; 
			else if ( rgItem.packageid ) 
				rgIncludedPackageIds[ rgItem.packageid ] = true; 
		} );
	}
	
	Event.observe( elemAllApps, 'dblclick', MoveClusterItem.bindAsEventListener( null, elemAllApps, elemIncludedApps, true ) );
	Event.observe( elemIncludedApps, 'dblclick', MoveClusterItem.bindAsEventListener( null, elemAllApps, elemIncludedApps, false ) );
	
	Event.observe( elemAllApps.up('form'), 'submit', SerializeClusterToForm.bindAsEventListener( null, elemAllApps.up('form'), 'capsule_lists[' + clusterName + ']', elemIncludedApps ) );
	
	// is the list of included apps an empty array?
	if ( !rgIncludedItems || rgIncludedItems.length == 0 )
		return;
	for ( var i = 0; i < rgIncludedItems.length; i++ )
	{
		var rgItem = rgIncludedItems[i];
		if ( rgItem.itemid )
		{
			var opt = new Element('div', {id: clusterName + '_clusteritem_' + rgItem.itemid, 'class': g_rgReferencedItems[rgItem.itemid]['cssClass'] } );
			opt.innerHTML = g_rgReferencedItems[rgItem.itemid]['name'];
			elemIncludedApps.appendChild(opt);
		} 
		else if ( rgItem.packageid )
		{
			var opt = new Element('div', {id: clusterName + '_clusterpackage_' + rgItem.packageid, 'class': 'app_Package' } );
			opt.innerHTML = g_rgReferencedPackages[rgItem.packageid];
			elemIncludedApps.appendChild(opt);
		}
	}
	
	CreateClusterSortable( elemIncludedApps );
}

function SerializeClusterToForm( event, form, inputName, elemIncludedApps )
{
	var rgItems = GetClusterItemsAsArray( elemIncludedApps );
	var value = Object.toJSON( rgItems );
	form.appendChild( new Element( 'input', {type: 'hidden', value: value, name: inputName } ) );
	return true;
}

function GetClusterItemsAsArray( elemIncludedApps )
{
	var rgItems = [];
	elemIncludedApps.childElements().each( function( e ) {
		var id = e.id;
		var rgMatch = id.match( /clusteritem_([0-9]*)/ );
		if ( rgMatch )
		{
			rgItems[ rgItems.length ] = { itemid: rgMatch[1] };
		}
		else
		{
			rgMatch = id.match( /clusterpackage_([0-9]*)/ );
			if ( rgMatch )
				rgItems[ rgItems.length ] = { packageid: rgMatch[1] };
		}
	});
	return rgItems;
}

function MoveClusterItem( event, elemAvailable, elemIncluded, bAdding )
{
	var elemFrom = bAdding ? $(elemAvailable) : $(elemIncluded);
	var elemTo = bAdding ? $(elemIncluded) : $(elemAvailable);
	var elem = event.element();
	if ( elem && elem.descendantOf( elemFrom ) )
	{
		elemTo.appendChild( elem.remove() );
	}
	CreateClusterSortable( elemIncluded );
}

function CreateClusterSortable( elem )
{
	Sortable.destroy( elem );
	Position.includeScrollOffsets = true;
	Sortable.create( elem, {tag: 'div', scroll: $(elem).up('.appselect_list_ctn') } );
}

function PreviewCapsules( strSize, elemIncluded )
{
	var rgItems = GetClusterItemsAsArray( $(elemIncluded) );

	var url = g_szBaseUrl + '/admin/store/pagecapsulepreview/?'; 
	url += Object.toQueryString( { strCapsuleJSON: Object.toJSON( rgItems ), strCapsuleSize: strSize } );
	
	var win = window.open(url,'capsule_preview','height=584,width=724,resize=yes,scrollbars=yes');
	win.focus();
}

function MovePackageApp( from, to )
{
	var elemFrom = $(from);
	var elemTo = $(to);
	var valuesMoved = null;

/*
 * This code works well for single selection, not multi-selection
	if ( elemFrom.selectedIndex >= 0 )
	{
		var opt = $(elemFrom.options[elemFrom.selectedIndex]);
		elemTo.appendChild( opt.remove() );
	}
*/
	// Here is the multi-selection friendly (will be slower than above in case there are many items).
	for ( var i = 0; i < elemFrom.options.length ; )
	{
		var opt = elemFrom.options[i];
		if ( opt.selected )
		{
			elemTo.appendChild( opt.remove() );
			// If we move from one to the other, we are actually not increasing the counter,
			// otherwise we would skip the test for the next item (it would have the same index as the current index).
			if ( valuesMoved == null )
			{
				valuesMoved = {};
			}
			valuesMoved[ opt.value ] = true;
		}
		else
		{
			++i;
		}
	}
	return valuesMoved;
}

function TogglePackageItemGiftability( select )
{
	var selectElem = $(select);
	if ( selectElem.selectedIndex >= 0 )
	{
		$( selectElem.options[ selectElem.selectedIndex ] ).toggleClassName( 'giftable' );
	}
}

function BuildPackageAppList( form )
{
	var elemIncludedApps = $('package_included_app_list');
	var strAppList = '';
	var strGiftableList = '';
	var bFirst = true;
	for ( var i = 0; i < elemIncludedApps.options.length; i++ )
	{
		if ( !bFirst )
			strAppList += ',';
		else
			bFirst = false;
		strAppList += elemIncludedApps.options[i].value;
		if ( elemIncludedApps.options[i].hasClassName( 'giftable' ) )
			strGiftableList += elemIncludedApps.options[i].value + ',';
	}
	
	form.appendChild( new Element( 'input', {type: 'hidden', name: 'package_included_apps', value: strAppList } ) );
	form.appendChild( new Element( 'input', {type: 'hidden', name: 'package_giftable_apps', value: strGiftableList } ) );
	
	return true;
}

var lastFilters = new Object();
function FilterList( target, str )
{
	if( Prototype.Browser.Gecko ||  $(target).tagName == "DIV" )
		return FilterListFast( target, str );

	// @note Tom Bui: this doesn't work at all for contracting, since we don't just filter apps with this function anymore

	var lastFilter = lastFilters[target];
	if ( !lastFilter )
		lastFilter = '';

	str = str.toLowerCase();
	if ( str == lastFilter )
		return false;

	var expanding = false;
	var contracting = false;
	if ( str.length > lastFilter.length && str.startsWith( lastFilter ) )
		expanding = true;
	if ( !str || str.length < lastFilter.length && lastFilter.startsWith( str ) )
		contracting = true;

	var strParts = str.split(/\W/);

	var elemTarget = $(target);
	var elemParent = elemTarget.parentNode;
	elemParent.removeChild( elemTarget );

	rgChildren = elemTarget.childElements();

	for ( var i = 0; i < rgChildren.length; i++ )
	{
		var child = rgChildren[i];
		//if ( child.nodeType != child.ELEMENT_NODE )
		//	continue;

		if ( !child.lcText )
			child.lcText = (child.innerText || child.textContent).toLowerCase();

		var text = child.lcText;
		var show = true;
		for ( var iPart = 0; show && iPart < strParts.length; iPart++ )
			if ( !text.include( strParts[iPart] ) )
				show=false;

		if ( !show )
			elemTarget.removeChild( child );
	}

	lastFilters[target] = str;
	elemParent.appendChild( elemTarget );
	return true;
}

function FilterListFast( target, str )
{
	var lastFilter = lastFilters[target];
	if ( !lastFilter )
		lastFilter = '';
	
	str = str.toLowerCase();
	if ( str == lastFilter )
		return false;

	var expanding = false;
	var contracting = false;
	if ( str.length > lastFilter.length && str.startsWith( lastFilter ) )
		expanding = true;
	if ( !str || str.length < lastFilter.length && lastFilter.startsWith( str ) )
		contracting = true;

	var strParts = str.split(/\W/);

	var elemTarget = $(target);
	var elemParent = elemTarget.parentNode;
	elemParent.removeChild( elemTarget );
	
	var rgChildren = elemTarget.childNodes;
	for ( var i = 0; i < rgChildren.length; i++ )
	{
		var child = rgChildren[i];
		if ( child.nodeType != child.ELEMENT_NODE )
			continue;
		if ( expanding && child.style.display=='none' || contracting && child.style.display != 'none' )
			continue;
		if ( !child.lcText )
			child.lcText = (child.innerText || child.textContent).toLowerCase();
		
		var text = child.lcText;
		var show = true;
		for ( var iPart = 0; show && iPart < strParts.length; iPart++ )
			if ( !text.include( strParts[iPart] ) )
				show=false;
		
		if ( show )
			child.style.display = '';
		else
			child.style.display = 'none';
	}
	lastFilters[target] = str;
	elemParent.appendChild( elemTarget );
	return true;
}

function ImageHoverPreview( event, divHover, url )
{
	if (!event) var event = window.event;
	
	var hover = $(divHover);
	if ( hover.parentNode != document.documentElement )
	{
		document.documentElement.appendChild( hover.remove() );
	}
	if ( !hover.visible() || hover.hiding )
	{
		hover.hiding = false;
		if ( hover.effect ) hover.effect.cancel();
		hover.effect = Effect.Appear( hover, {duration: 0.2} );
	}
	hover.style.left = event.pageX + 10 + 'px';
	hover.style.top = event.pageY + 20 + 'px';
	hover.down('img').src = url;
}

function HideImageHover( event, divHover, elem )
{
	if (!event) var event = window.event;
	var reltarget = (event.relatedTarget) ? event.relatedTarget : event.toElement;
	if ( reltarget && ( $(reltarget).up( '#' + elem.identify() ) /* || $(reltarget).up( '#' + divHover.id ) */ ) )
		return;
	
	var hover = $(divHover);
	if ( hover.effect ) hover.effect.cancel();
	if ( hover.visible() )
	{
		hover.effect = Effect.Fade( hover, {duration: 0.2} );
		hover.hiding = true;
	}
}

function FlushStoreHome( elemStatus )
{
	$(elemStatus).update( 'Flushing the home page now...' );

	new Ajax.Updater( 
			elemStatus, 
			g_szBaseUrl + '/admin/store/flushstorehome', 
			{ } );
}

function OnGenreSelect( checkbox, id, name )
{
	var elemPrimary = $('primary_genre_select');
	if ( checkbox.value )
	{
		var elemOpt = new Element( 'option', { value: id } );
		elemOpt.update( name );
		elemPrimary.appendChild( elemOpt );
		
		if ( !elemPrimary.value )
			elemPrimary.value = id;
	}
	else
	{
		var bWasSelected = (elemPrimary.value == id);
		var elemOpt = null;
		for ( var i = 0; i < elemPrimary.options.length && !elemOpt; i++ )
		{
			if ( elemPrimary.options[i].value == id )
				elemOpt = elemPrimary.options[i];
		}
		if ( elemOpt )
		{
			elemPrimary.removeChild( elemOpt );
			if ( bWasSelected )
			{
				elemPrimary.value = elemPrimary.options[ elemPrimary.options.length > 1 ? 1 : 0 ].value;
			}
		}
	}
}

function MoveSelectItemUp( element )
{
	var list = $( element );
	var options = list.select('option');

	for ( var i = 1; i < options.length; i++ )
	{
		var o = options[i];

		if ( o.selected )
		{
			list.removeChild( o );
			list.insertBefore( o, options[ i - 1 ] );
		}
	}
}

function MoveSelectItemDown( element )
{
	var list = $( element );
	var options = list.select('option');

	for ( var i = options.length - 2; i >= 0; i-- )
	{
		var o = options[i];

		if ( o.selected )
		{
			var nextOpt = options[i + 1];
			o = list.removeChild(o);
			nextOpt = list.replaceChild(o, nextOpt);
			list.insertBefore(nextOpt, o);
		}
	}
}

function ReenableSubmitInput( matchingValue, newValue )
{
	var inputElements = document.getElementsByTagName( 'input' );
	for ( var i = 0 ; i < inputElements.length ; ++i )
	{
		var inputElement = inputElements[ i ];
		if ( inputElement.type != 'submit' )
		{
			continue;		// Only interested in 'submit' elements
		}
		if ( inputElement.value != matchingValue )
		{
			continue;		// No point sending data that don't have any particular values
		}
		inputElement.value = newValue;
		inputElement.disabled = null;
	}
}


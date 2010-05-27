/*
 * Spotter Gadget Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var spotter = Spotter.spotterFactory("twitter.search",{searchString:"oil spill"});
    var lc = new ListController($('#list_view'));
    spotter.registerObserver(lc);
    spotter.spot(5);
}

function ListController(view)  {
    this.view = view;
}


ListController.prototype.notify = function(tweets)  {
    for(var t in tweets)  {
	var temp = $("<div></div>");
	$(temp).attr('id',tweets[t]['id']).attr('class','tweet');
	$(temp).html("<a target='_blank' class='from_user' href='http://www.twitter.com/"+ tweets[t]['from_user'] +"'>"+tweets[t]['from_user']+
                     "</a> &nbsp;"+tweets[t]['text']);
	profileImg = $("<img></img>");
	$(profileImg).attr('src',tweets[t]['profile_image_url']).attr('class','profile_image').attr('height',43).attr('width',43);
	$(temp).prepend(profileImg);
	$(temp).hide();
	$(this.view).prepend(temp);
	$(temp).fadeIn();
    }
}



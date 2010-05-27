/**
 * Spotter Gadget Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var trendSpotter = Spotter.spotterFactory("twitter.trends");
    var tc = new TrendController($("#trend_view"));
    trendSpotter.registerObserver(tc);
    trendSpotter.spot(60);
}

function TrendController(view)  {
    this.view = view;
    this.spotter = null;
}

TrendController.prototype.notify = function(trends)  {
    var trend = trends.added[0].name;
    this.view.html("<span class='trend'>"+trend+"</span>");
    this.spotter = Spotter.spotterFactory("twitter.search",{searchString:trend});
    var lc = new ListController($('#list_view'));
    this.spotter.registerObserver(lc);
    this.spotter.spot(15);
}


function ListController(view)  {
    this.view = view;
}

ListController.prototype.notify = function(tweets)  {
    for(var t in tweets)  {
	var temp = $("<div></div>");
	$(temp).attr('id',tweets[t]['id']);
        $(temp).attr('class','tweet');
	$(temp).html("<a target='_blank' class='from_user' href='http://www.twitter.com/"+ tweets[t]['from_user'] +"'>"+tweets[t]['from_user']+
                     "</a> &nbsp;"+tweets[t]['text']);
	profileImg = $("<img></img>");
	profileImg.attr('src',tweets[t]['profile_image_url']);
	profileImg.attr('class','profile_image');
	profileImg.attr('height',43);
	profileImg.attr('width',43);
	$(temp).prepend(profileImg);
	$(temp).hide();
	$(this.view).prepend(temp);
	$(temp).fadeIn();
    }
}



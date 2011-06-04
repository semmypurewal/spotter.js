/**
 * Spotter Gadget Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var trendSpotter = new Spotter("twitter.trends", {exclude:"hashtags", period:60});
    var tc = new TrendController($("#trend_view"));
    trendSpotter.register(tc);
    trendSpotter.start();
}

function TrendController(view)  {
    this.view = view;
    this.spotter = null;
}

TrendController.prototype.notify = function(trends)  {
    var trend = trends.trends[trends.trends.length-1].name;
    this.view.html("<span class='trend'>"+trend+"</span>");
    if(this.spotter != null) this.spotter.stop();
    this.spotter = new Spotter("twitter.search",{q:trend, period:30, lang:'en'});
    var lc = new ListController($('#list_view'));
    this.spotter.register(lc);
    this.spotter.start();
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
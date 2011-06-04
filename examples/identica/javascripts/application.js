/**
 * Spotter Gadget Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    //var trendSpotter = new Spotter("twitter.trends", {exclude:"hashtags",period:60});
    var tc = new TrendController($("#trend_view"));
    tc.notify();
    //trendSpotter.register(tc);
    //trendSpotter.spot();
}

function TrendController(view)  {
    this.view = view;
    this.spotter = null;
}

TrendController.prototype.notify = function(trends)  {
    //var trend = trends.added[4].name;
    var trend = "linux|GNU|apple|mac";
    this.view.html("<span class='trend'>"+trend+"</span>");
    if(this.spotter != null) this.spotter.stop();
    this.spotter = new Spotter("identica.realtimesearch",{q:trend});
    var lc = new ListController($('#list_view'));
    this.spotter.register(lc);
    this.spotter.start();
}


function ListController(view)  {
    this.view = view;
}

ListController.prototype.notify = function(statuses)  {
    for(var t in statuses)  {
	var temp = $("<div></div>");
	$(temp).attr('id',statuses[t]['id']);
        $(temp).attr('class','tweet');
	$(temp).html("<a target='_blank' class='from_user' href='"+ statuses[t]['user']['statusnet:profile_url'] +"'>"+statuses[t]['user']['screen_name']+
                     "</a> &nbsp;"+statuses[t]['text']);
	profileImg = $("<img></img>");
	profileImg.attr('src',statuses[t]['user']['profile_image_url']);
	profileImg.attr('class','profile_image');
	profileImg.attr('height',43);
	profileImg.attr('width',43);
	$(temp).prepend(profileImg);
	$(temp).hide();
	$(this.view).prepend(temp);
	$(temp).fadeIn();
    }
}



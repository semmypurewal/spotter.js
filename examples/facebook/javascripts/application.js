/**
 * Spotter Gadget Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var trendSpotter = new Spotter("twitter.trends", {exclude:"hashtags",period:60});
    var tc = new TrendController($("#trend_view"));
    //trendSpotter.register(tc);
    //trendSpotter.start();
    tc.notify();
}

function TrendController(view)  {
    this.view = view;
    this.spotter = null;
}

TrendController.prototype.notify = function(trends)  {
    //var trend = trends.added[0].name;
    var trend = "computer";
    this.view.html("<span class='trend'>"+trend+"</span>");
    if(this.spotter != null) this.spotter.stop();
    this.spotter = new Spotter("facebook.search",{q:trend,period:30});
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
	$(temp).html("<a target='_blank' class='from_user' href='"+statuses[t]['profile_url']+"'>"+statuses[t]['from']['name']+
                     "</a> &nbsp;"+statuses[t]['message']);
	profileImg = $("<img></img>");
	profileImg.attr('src',statuses[t]['profile_image_url']);
	profileImg.attr('class','profile_image');
	profileImg.attr('height',43);
	profileImg.attr('width',43);
	$(temp).prepend(profileImg);
	$(temp).append("<div>"+statuses[t].created_time+"</div>");
	$(temp).hide();
	$(this.view).prepend(temp);
	$(temp).fadeIn();
    }
}
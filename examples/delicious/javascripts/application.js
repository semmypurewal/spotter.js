/*
 * Spotter Delicious Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var s = new com.yellowsocket.spotter.Spotter("delicious.recent", {tags:"zelda",frequency:30});
    lc = new ListController($('#results_list'));
    s.register(lc);
    s.spot();
}

function ListController(view)  {
    this.view = view;
    this.firstNotify = true;
    this.freshResults = [];
}

ListController.prototype.refresh = function()  {
    $("#message_view").hide();
    var num = this.freshResults.length;
    var results_view = $("<div></div>");
    results_view.hide();
    results_view.attr('class','results_view');
    for(var i = 0; i < num; i++)  {
	results_view.append(this.freshResults[i]);
    }
    for(i = 0; i < num; i++) this.freshResults.shift();
    $(this.view).prepend(results_view);
    results_view.fadeIn();
}

ListController.prototype.notify = function(results)  {
    for(var t = 0; t < results.length; t++)  {
	var temp = $("<div class='link'></div>");
	temp.append("<p class='link_url'><a target='_blank' class='delicious_link' href='"+results[t]['u']+"'>"+results[t]['d']+"</a></p>");
	temp.append("<p class='user'>via <a target='_blank' class='delicious_user' href='http://www.delicious.com/"+results[t]['a']+
                    "'>"+results[t]['a']+"</a></p>");
	var tags = results[t]['t'];
	var tagString = "";
	for(var i=0; i < tags.length; i++)  {
	    if(i !== tags.length-1)  {
		tagString += tags[i]+", ";
	    }
	    else  {
		tagString += tags[i];
	    }
	}
	
	temp.append("<p class='tags'>tags: "+tagString+"</p>");
	//'(http\:\/\/S*/)S*'
	temp.append("<p class='url'>"+(results[t].u).replace(new RegExp('(http\:\/\/[A-Za-z0-9\.]*\/).*','g'), '$1...') +"</p>");
	temp.append("<p class='date'>"+results[t]['dt']+"</p>");
	this.freshResults.push(temp);
    }

    if(this.firstNotify)  {
	$("#message_view").hide();
	this.refresh();
	this.firstNotify = false;
    }
    else  {
	$("#message_view").html("<span class='refresh_count'>"+this.freshResults.length+"</span> fresher results available! Click <a class='refresh_link' href='#' onclick='lc.refresh();'>here</a> to refresh!");
	$("#message_view").slideDown();
    }
}
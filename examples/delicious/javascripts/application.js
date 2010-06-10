/*
 * Spotter Delicious Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var spotter = Spotter.spotterFactory("delicious.recent");
    var lc = new ListController($('#list_view'));
    spotter.registerObserver(lc);
    spotter.spot(30);
}

function ListController(view)  {
    this.view = view;
}

ListController.prototype.notify = function(results)  {
    var results_view = $("<div></div>");
    $(results_view).attr('class','results_view');
    for(var t = 0; t < results.length; t++)  {
	var temp = $("<div class='link'></div>");
	temp.append("<p class='link_url'><a target='_blank' class='delicious_link' href='"+results[t]['u']+"'>"+results[t]['d']+"</a></p>");
	temp.append("<p class='user'>via <a target='_blank' class='delicious_user' href='http://www.delicious.com/"+results[t]['a']+"'>"+results[t]['a']+"</a></p>");

	var tags = results[t]['t'];
	var tagString = "";
	for(var i=0; i < tags.length; i++)  {
	    if(i !== tags.length-1)
		tagString += tags[i]+", ";
	    else
		tagString += tags[i];
	}

	temp.append("<p class='tags'>tags: "+tagString+"</p>");
	temp.append("<p class='date'>"+results[t]['dt']+"</p>");

	$(results_view).append(temp);
	//$(temp).fadeIn();
    }
    $(this.view).prepend(results_view);
    $(results_view).fadeIn();

    
}
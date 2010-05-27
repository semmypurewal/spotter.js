/*
 * Spotter Delicious Example
 * Copyright (C) 2010 Semmy Purewal
 */

function init()  {
    var spotter = Spotter.spotterFactory("delicious.recent");
    var lc = new ListController($('#list_view'));
    spotter.registerObserver(lc);
    spotter.spot(3);
}

function ListController(view)  {
    this.view = view;
}


ListController.prototype.notify = function(results)  {
    results = results.data;
    for(var t in results)  {
	var temp = $("<div></div>");
	$(temp).attr('class','link');
	$(temp).html("<a target='_blank' class='delicious_link' href='"+results[t]["u"]+"'>"+results[t]["d"]+"</a>");
	$(temp).hide();
	$(this.view).prepend(temp);
	$(temp).fadeIn();
    }
}



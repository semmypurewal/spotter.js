/*
Spotter Example
Copyright (C) 2010 Semmy Purewal

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

Note that this example also uses JQuery, which is dual licensed under
the MIT and GPL licenses.
*/

function init()  {
    spotter = Spotter.spotterFactory();
    lc = new ListController($('#list_view'));
    spotter.registerObserver(lc);
    spotter.searchInterval('oil spill',10);
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



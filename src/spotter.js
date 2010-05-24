/*
Spotter.js
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
*/


/**
 * spotterFactory()
 *
 * This is how you build spotter objects (you don't use a
 * constructor).  Note that the factory function keeps
 * track of the number of instances so that it can assign
 * each one a unique variable name.
 */
Spotter.spotterFactory = function() {
    Spotter.instanceCount = Spotter.instanceCount == null?1:Spotter.instanceCount++;
    var variable_name = "__SPOTTER_OBJECT_"+Spotter.instanceCount+Math.floor(Math.random()*100);
    var script = variable_name + " = new Spotter(\"" + variable_name + "\");";
    return eval(script);
}

/**
 * Constructor
 *
 * Note that this is not the 'normal' way to build Spotter
 * objects.  Use the class function spotterFactory() instead.
 *
 * If you *must* use this function, note that you must include
 * the variable name as a parameter.  This is so that the
 * Twitter API response can be sent to the correct object for
 * processing.
 *
 * @param var_name the name of the variable associated with this
 * Spotter object
 *
 */
function Spotter(var_name)  {
    this.var_name = var_name;
    this.refresh_url = "";
    this.lastCallReturned = true;
    this.lastScriptTag = null;
    this.observers = new Array();
}

/**
 * searchInterval
 *
 * This function searches at the specified time intervals and
 * all listeners are notified when there is new data to report.
 *
 * @param search_string
 * @param time
 */
Spotter.prototype.searchInterval = function(search_string, seconds)  {
    this.search(search_string);
    var obj = this;
    this.intervalTImer = setInterval(function() { obj.search(search_string); }, seconds*1000);
}

/**
 * search
 *
 * This function does a single search. After the search is done, 
 * all listeners are notified if there is new data to report.
 *
 * It does nothing if this Spotter is waiting for another
 * search to return.
 *
 * @param search_string
 */
Spotter.prototype.search = function(search_string)  {
    if(this.lastCallReturned)  {
	var url = 'http://search.twitter.com/search.json'
	url += this.refresh_url != ""?this.refresh_url:'?q='+escape(search_string);
	url += '&callback='+this.var_name+'.searchCallBack';
	url += '&random='+Math.floor(Math.random()*10000);
	var head = document.getElementsByTagName("head");
	var script = document.createElement('script');
	script.id = 'twitter_search_script'+this.var_name;
	script.type = 'text/javascript';
	script.src = url;
	if(this.lastScriptTag != null) head[0].removeChild(this.lastScriptTag);
	head[0].appendChild(script);
	this.lastScriptTag = script;
    }
}


/**
 * This is the callback function
 */
Spotter.prototype.searchCallBack  = function(data)  {
    var tweets = data['results'];
    this.refresh_url = data['refresh_url'];
    if(tweets.length != 0) this.notifyObservers(tweets);
    this.lastCallReturned = true;
}


/********** OBSERVABLE INTERFACE ***************/

/**
 * Register an observer with this twitter watcher
 * @param observer this method verifies that the notify method is present
 */
Spotter.prototype.registerObserver = function(observer) {
    if(observer.notify != undefined)  {
	this.observers.push(observer);
    }
}

/**
 * Notify this twitter watcher's observer
 */
Spotter.prototype.notifyObservers = function(tweets)  {
    for(var i in this.observers)
	this.observers[i].notify(tweets);
}
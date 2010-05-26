/**
 * Spotter.js
 * Copyright (C) 2010 Semmy Purewal
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

Spotter = {}

/**
 * spotterFactory()
 *
 * This is how you build spotter objects (you don't use a
 * constructor).  Note that the factory function keeps
 * track of the number of instances so that it can assign
 * each one a unique variable name.
 */
Spotter.spotterFactory = function() {
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
     * @param varName the name of the variable associated with this
     * Spotter object
     *
     */
    function Spotter(v)  {
	var varName = v;
	var refreshURL = "";
	var lastCallReturned = true;
	var lastScriptTag = null;
	this.observers = new Array();
	var lastTrends = null;
	
	/**
	 * searchInterval
	 *
	 * This function searches at the specified time intervals and
	 * all listeners are notified when there is new data to report.
	 *
	 * @param searchString
	 * @param time
	 */
	this.searchInterval = function(searchString, seconds)  {
	    this.search(searchString);
	    var obj = this;
	    this.intervalTImer = setInterval(function() { obj.search(searchString); }, seconds*1000);
	}

	/**
	 * search
	 *
	 * This function sets up a request for a single search. It then calls the 
	 * request function with the appropriate url. After the search is done, 
	 * all listeners are notified if there is new data to report.
	 *
	 * It does nothing if this Spotter is waiting for another
	 * search to return.
	 *
	 * @param searchString
	 */
	this.search = function(searchString)  {
	    if(lastCallReturned)  {
		var url = 'http://search.twitter.com/search.json'
		url += refreshURL != ""?refreshURL:'?q='+escape(searchString);
		url += '&callback='+varName+'.searchCallBack';
		url += '&random='+Math.floor(Math.random()*10000);
		request(url);
	    }
	}

	/**
	 * searchCallBack
	 *
	 * recieves new tweets from the twitter api
	 * and notifies observers of results
	 * notifies observers of results
	 *
	 * @param {JSON} result from the twitter API
	 */
	this.searchCallBack  = function(data)  {
	    var tweets = data['results'];
	    refreshURL = data['refresh_url'];
	    if(tweets.length != 0) this.notifyObservers(tweets);
	    lastCallReturned = true;
	}
	
	/**
	 * trendsInterval
	 *
	 * This function checks trends at the specified time intervals and
	 * all listeners are notified when there is new data to report.
	 *
	 * @param {Object} options option for twitter API
	 * @param {Integer} time
	 */
	this.trendsInterval = function(seconds, options)  {
	    this.trends(options);
	    var obj = this;
	    this.intervalTImer = setInterval(function() { obj.trends(options); }, seconds*1000);
	}

	/**
	 * trends
	 * 
	 * Sets up a request to the current trending topics on Twitter.  It
	 * calls the request function with the appropriate url.  After the
	 * search is done, the request function notifies the observers
	 * if there is new data to report
	 *
	 * @param {Dictionary} options currently allows for the exclusion of hashtags
	 *
	 * TODO: add support for all twitter API options for trends
	 */
	this.trends = function(options)  {
	    if(lastCallReturned) {
		var url = "http://search.twitter.com/trends.json?";
		if(options != undefined && options['exclude'] != undefined) url+="exclude="+options['exclude'];
		url+="&callback="+varName+".trendsCallBack";
		//alert(url);
		request(url);
	    }
	}

	/**
	 * trendsCallBack
	 *
	 * calculates the difference between old and new trends and 
	 * notifies observers of results
	 *
	 * @param {JSON} result from the twitter API
	 */
	this.trendsCallBack = function(data)  {
	    var trends = data['trends'];
	    if(lastTrends == null)
		result = {"added":trends, "removed":{}, "trends":trends};
	    else  {
		var tempArray = complements(trends, lastTrends);
		var changeArray = changes(trends, lastTrends);
		result = {"added":tempArray[0],"removed":tempArray[1], "trends":trends, "changes":changeArray};
	    }
	    lastTrends = trends;
	    if(result['added'].length > 0 || result['removed'].length > 0) this.notifyObservers(result);
	    lastCallReturned = true;
	}


	/********** 'PRIVATE' HELPER FUNCTIONS ***************/
	
	/**
	 * Returns an array of integers that represent
	 * the indices of the elements of b in the elements
	 * of a.  Currently assumes these are trend objects.
	 * Also assumes that all elements in a and b are uniq
	 * (i.e. they are sets)
	 *
	 * For example
	 *
	 * a:      ["a","b","c","d"]
	 * b:      ["c","b","d","f"]
	 * result: [-1 , 1 , 0 , 2 ]  
	 *
	 * @param {Array} An array of length n
	 * @param {Array} An array of length n
	 *
	 * TODO: make this more general
	 * TODO: make this private
	 */
	function changes(a,b)  {
	    /*a = [{'name':'a'},{'name':'b'},{'name':'c'},{'name':'d'}];
	      b = [{'name':'c'},{'name':'b'},{'name':'d'},{'name':'f'}];*/
	    
	    var result = new Array();
	    var indices = new Object();
	    for(var i in b)
		indices[b[i]]==undefined?indices[b[i]['name']]=parseInt(i):null;
	    for(var i in a)
		result[i] = indices[a[i]['name']]==undefined?-1:indices[a[i]['name']];
	    return result;
	}
    
	/**
	 * returns an array of arrays.  the first
	 * are the elements in a that are not in b
	 * and the second are the elements in b that
	 * are not in a.
	 *
	 * For now this assumes a trends object
	 *
	 * TODO: make private
	 * TODO: make more general (for arbitrary arrays)
	 * TODO: use the changes algorithm as a subroutine
	 *
	 */
	function complements(a, b)  {
	    var counts = new Object();
	    var aMinusB = new Array();
	    var bMinusA = new Array();
	    for(var i in a)
		counts[a[i]]==undefined?counts[a[i]['name']]=i:null;
	    for(var j in b)
		counts[b[j]['name']]==null?bMinusA.push(b[j]):counts[b[j]['name']]=-1;
	    for(var k in counts)
		counts[k] >= 0?aMinusB.push(a[counts[k]]):null;
	    return [aMinusB,bMinusA];
	}
    
    
	/**
	 * Makes the ajax request to the Twitter API by inserting a script
	 * tag.
	 *
	 * @param {String} url the json request URL
	 * 
	 * TODO: make this private somehow
	 */
	function request(url)  {
	    var head = document.getElementsByTagName("head");
	    var script = document.createElement('script');
	    script.id = 'spotter_search_request'+varName;
	    script.type = 'text/javascript';
	    script.src = url;
	    if(lastScriptTag != null) head[0].removeChild(lastScriptTag);
	    head[0].appendChild(script);
	    lastScriptTag = script;
	}
	/********** END 'PRIVATE' HELPER FUNCTIONS ***************/
    }//end spotter constructor


    /********** OBSERVABLE INTERFACE ***************/
    /**
     * Register an observer with this twitter watcher
     * @param {Observer} observer this method verifies that the notify method is present
     *
     */
    Spotter.prototype.registerObserver = function(observer) {
	if(observer.notify != undefined && typeof observer.notify == 'function')
	    this.observers.push(observer);
	else
	    throw new TypeError('Spotter: observer must implement a notify method.');
    }

    /**
     * Notify this twitter watcher's observer
     */
    Spotter.prototype.notifyObservers = function(tweets)  {
	for(var i in this.observers)
	    this.observers[i].notify(tweets);
    }
    /********** END OBSERVABLE INTERFACE ***************/



    Spotter.instanceCount = Spotter.instanceCount == null?1:Spotter.instanceCount++;
    var variable_name = "__SPOTTER_OBJECT_"+Spotter.instanceCount+Math.floor(Math.random()*100);
    var script = variable_name + " = new Spotter(\"" + variable_name + "\");";
    return eval(script);
}


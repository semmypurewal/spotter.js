/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 */

spotter = {}

Spotter = spotter;

/**
 * spotterFactory()
 *
 * This is how you build spotter objects (you don't use a
 * constructor).  Note that the factory function keeps
 * track of the number of instances so that it can assign
 * each one a unique variable name.
 */
spotter.spotterFactory = function(m, options) {

    /**
     * private constructor
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
    function _spotter(v)  {
	var varName = v;
	var lastCallReturned = true;
	var lastScriptTag = null;
	this.observers = new Array();

	/* may not be the best way to do this */
	var module = eval("spotter.modules."+m+";")(options);

	/**
	 * spot
	 *
	 * This function searches at the spots at the specified time interval and
	 * all listeners are notified when there is new data to report.
	 *
	 * @param {Number} seconds, optional
	 */
	this.spot = function(seconds)  {
	    if((!seconds || seconds < 1) && lastCallReturned)  {
		var url = module.url();
		url += '&callback='+varName+'.callback';
		url += '&random='+Math.floor(Math.random()*10000);
		request(url);
	    }
	    else  {
		this.spot();
		var obj = this;
		this.intervalTImer = setInterval(function() { obj.spot(); }, seconds*1000);		
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
	this.callback  = function(data)  {
	    var results = module.callback(data);
	    if(results.update) this.notifyObservers(results);
	    lastCallReturned = true;
	}

	/**
	 * Makes the ajax request to the Twitter API by inserting a script
	 * tag.
	 *
	 * @param {String} url the json request URL
	 */
	function request(url)  {
	    var head = document.getElementsByTagName("head");
	    var script = document.createElement('script');
	    script.id = 'spotter_request'+varName;
	    script.type = 'text/javascript';
	    script.src = url;
	    if(lastScriptTag != null) head[0].removeChild(lastScriptTag);
	    head[0].appendChild(script);
	    lastScriptTag = script;
	}

	/********** OBSERVABLE INTERFACE ***************/
	/**
	 * Register an observer with this twitter watcher
	 * @param {Observer} observer this method verifies that the notify method is present
	 *
	 */
	this.registerObserver = function(observer) {
	    if(observer.notify != undefined && typeof observer.notify == 'function')
		this.observers.push(observer);
	    else
		throw new TypeError('Spotter: observer must implement a notify method.');
	}

	/**
	 * Notify this twitter watcher's observer
	 */
	this.notifyObservers = function(tweets)  {
	    for(var i in this.observers)
		this.observers[i].notify(tweets);
	}
	/********** END OBSERVABLE INTERFACE ***************/

    }//end spotter constructor

    this.instanceCount = Spotter.instanceCount == null?1:Spotter.instanceCount++;
    var variable_name = "__SPOTTER_OBJECT_"+Spotter.instanceCount+Math.floor(Math.random()*100);
    var script = variable_name + " = new _spotter(\"" + variable_name + "\");";
    return eval(script);
}


/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * @version .1
 */

spotter = {}

Spotter = spotter;

/**
 * spotterFactory
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
     * @private
     * @constructor
     * @param {String} v the name of the variable associated with this Spotter object
     */

    var _spotter = function(v)  {
	var varName = v;
	var lastCallReturned = true;
	var lastScriptTag = null;
	var observers = new Array();
	var intervalTimer = null;


	//this is not the best way to do this
	var module = eval("spotter.modules."+m+";")(options);

	if(module === undefined) throw new Error("Module " + m + " not found!");

	/**
	 * spot
	 *
	 * Execute the ajax request at the specified time intervals.  Note that
	 * this function does not execute if the object is waiting on another
	 * response.
	 *
	 *
	 * @member Spotter
	 * @param {Number} optional parameter represeting the number of seconds
	 *        between each request.  If this parameter is not provided, the
	 *        function performs a single request.
	 *
	 * TODO: set up a time out so that if the last request doesn't return 
	 *       the remaining requests are not blocked
	 *
	 */
	this.spot = function(seconds)  {
	    if((!seconds || seconds < 1) && lastCallReturned)  {
		var url = module.url();
		if(url instanceof Object && url.callbackParam != undefined)
		    url = url.url+'&'+url.callbackParam+'='+varName+'.callback';
		else
		    url += '&callback='+varName+'.callback';
		url += '&random='+Math.floor(Math.random()*10000);
		request(url);
	    }
	    else  {
		this.spot();
		var obj = this;
		intervalTimer = setInterval(function() { obj.spot(); }, seconds*1000);		
	    }
	}

	/**
	 * callback
	 *
	 * Receive the response from the ajax request and send it
	 * to the appropriate module for processing.  Removes the
	 * defunct script tag from the DOM
	 * @member Spotter
	 * @param {Object} result from the API
	 */
	this.callback  = function(rawData)  {
	    var processedData = module.process(rawData); //send the raw data to the module for processing
	    //now the processedData has an 'update' attribute and a 'data' attribute
	    if(processedData.update) this.notifyObservers(processedData.data);
	    lastCallReturned = true;
	}


	/**
	 * stop
	 *
	 * Stops this spotter if it is currently spotting.
	 * @member Spotter
	 * @throws Error if you try to stop a stopped spotter
	 */
	this.stop = function()  {
	    if(intervalTimer == null)  {
		throw new Error("You can't stop a stopped spotter!");
	    }
	    else  {
		var head = document.getElementsByTagName("head");
		if(lastScriptTag != null) head[0].removeChild(lastScriptTag);
		clearInterval(intervalTimer);
	    }
	}


	/**
	 * Function that actually makes the request.
	 *
	 * @private
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
	 *
	 * @member Spotter
	 * @param {Object} observer this method verifies that the notify method is present
	 * @throws TypeError a TypeError is thrown if the parameter does not implement notify
	 */
	this.registerObserver = function(observer) {
	    if(observer.notify != undefined && typeof observer.notify == 'function')
		observers.push(observer);
	    else
		throw new TypeError('Spotter: observer must implement a notify method.');
	}

	/**
	 * Notify this observable's observers
	 *
	 * @param {Object} data that will be sent to the observers
	 */
	this.notifyObservers = function(data)  {
	    for(var i in observers)
		observers[i].notify(data);
	}
	/********** END OBSERVABLE INTERFACE ***************/
    }//end spotter constructor

    this.instanceCount = Spotter.instanceCount == null?1:Spotter.instanceCount++;
    var variable_name = "__SPOTTER_OBJECT_"+Spotter.instanceCount+Math.floor(Math.random()*100);
    var script = variable_name + " = new _spotter(\"" + variable_name + "\");";
    return eval(script);
}


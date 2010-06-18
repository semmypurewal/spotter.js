/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * @version .1
 *
 * TODO: get rid of eval if possible
 * TODO: make sure spotter object reference is in spotter's namespace
 * TODO: modify it so that the modules can better handle timing (big change)
 * TODO: generate documentation
 * TODO: create a definite namespace for this library
 */

spotter = {}

Spotter = spotter;

/**
 * spotterFactory
 *
 * Creates a new Spotter object with the specified module and options.
 *
 * @param m string representing the module that this spotter will use
 * @param options Object containing options that can be sent to that module
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
	var modFunc;
	var module;


	try  {
	    modFunc =  window["spotter"]["modules"][m.split(".")[0]][m.split(".")[1]];
	    if(modFunc === undefined) throw new Exception();
	} catch(Exception)  {
	    throw new Error("Module " + m + " not found! (Did you remember to include it via a script tag?)");
	}
	module = modFunc(options);  //yay no eval!
	if(!module.url || !module.process)  {
	    throw new Error("spotter.modules."+m+" is invalid.  (Does it return an object with url and process methods?)");
	}


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
	 * TODO: get rid of the number of seconds between requests, let that be
	 *       handled by the appropriate module
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
	 *
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
	    if(observer.notify !== undefined && typeof observer.notify === 'function')
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
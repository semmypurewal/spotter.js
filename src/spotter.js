/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * @version .1
 *
 * TODO: modify it so that the modules can better handle timing (big change)
 * TODO: create a definite namespace for this library
 */


/**
 * @namespace
 * The namespace of this library.
 */
spotter = {};

/**
 * Construct a Spotter object of the specified type with the specified
 * options.  See the specific module documentation for available
 * options.
 *
 * @constructor
 * @param {String} type the type the module type associated witht this spotter, e.g. "twitter.search"
 * @param {Object} options a hash of options for the appropriate module, e.g. {searchString: "Justing Beiber"}
 * @throws {Error} An error is thrown if there is a problem loading the module
 */
spotter.Spotter = function(type, options)  {
    this.instanceCount = this.instanceCount+1;
    var varName =  "so"+this.instanceCount+""+Math.floor(Math.random()*100);
    var lastCallReturned = true;
    var lastScriptTag = null;
    var observers = [];
    var intervalTimer = null;
    var module;

    window["spotter"][varName] = this;

    try  {
	module = new (window["spotter"]["modules"][type.split(".")[0]][type.split(".")[1]])(options);
    } catch(e)  {
	throw new Error("Spotter: Module " + type + " not found! (Did you remember to include it via a script tag?)");
    }

    if(!module.url || !module.process)  {
	throw new Error("Spotter: spotter.modules."+type+" is invalid.  (Does it return an object with url and process methods?)");
    }


    /**
     * Begin spotting.
     *
     * @param {Number} seconds optional parameter represeting the number of seconds
     *        between each request.  If this parameter is not provided, the
     *        function performs a single request.
     *
     * TODO: set up a time out so that if the last request doesn't return 
     *       the remaining requests are not blocked
     *
     * TODO: get rid of the number of seconds between requests, let that be
     *       handled by the appropriate module
     *
     */
    this.spot = function(seconds)  {
	var url;
	
	if((!seconds || seconds < 1) && lastCallReturned)  {
	    url = module.url();
	    if(url instanceof Object && url.callbackParam !== undefined)  {
		url = url.url+'&'+url.callbackParam+'=spotter.'+varName+'.callback';
	    }
	    else  {
		url += '&callback=spotter.'+varName+'.callback';
	    }
	    url += '&random='+Math.floor(Math.random()*10000);  //add random number to help avoid caching in safari and chrome
	    request(url);
	}
	else  {
	    this.spot();
	    var obj = this;
	    intervalTimer = setInterval(function() { obj.spot(); }, seconds*1000);
	}
    }
    
    /**
     * Receives the response from the ajax request and send it
     * to the appropriate module for processing.  Removes the
     * defunct script tag from the DOM.  Notifies observers if
     * the module determines there is new data.
     *
     * @param {Object} rawData Unprocessed data direct from the API
     */
    this.callback  = function(rawData)  {
	var processedData = module.process(rawData); //send the raw data to the module for processing
	//now the processedData has an 'update' attribute and a 'data' attribute
	if(processedData.update) this.notifyObservers(processedData.data);

	//here is where we need to set up the next call by getting the delay from the module

	lastCallReturned = true;
    }


    /**
     * Stops this spotter if it is currently spotting.
     *
     * @throws Error An error is thrown if you try to stop a stopped spotter
     */
    this.stop = function()  {
	if(intervalTimer === null)  {
	    throw new Error("Spotter: You can't stop a stopped spotter!");
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
    var request = function(url)  {
	var head = document.getElementsByTagName("head");
	var script = document.createElement('script');
	script.id = varName+'_'+'request';
	script.type = 'text/javascript';
	script.src = url;
	if(lastScriptTag !== null) head[0].removeChild(lastScriptTag);
	head[0].appendChild(script);
	lastScriptTag = script;
    }
    
    /********** OBSERVABLE MIXIN ***************/
    /**
     * Register an observer with this object
     *
     * @param {Object} observer this method verifies that the notify method is present
     * @throws TypeError a TypeError is thrown if the parameter does not implement notify
     */
    spotter.Spotter.prototype.registerObserver = function(observer) {
	if(observer.notify !== undefined && typeof observer.notify === 'function')
	    observers.push(observer);
	else
	    throw new TypeError('Observer must implement a notify method.');
    }
    
    /**
     * Notify this Observable's observers
     *
     * @param {Object} data that will be sent to the observers
     */
    spotter.Spotter.prototype.notifyObservers = function(data)  {
	for(var i in observers)
	    observers[i].notify(data);
    }
    /********** END OBSERVABLE MIXIN ***************/
}//end spotter constructor

spotter.Spotter.prototype.instanceCount = 0;
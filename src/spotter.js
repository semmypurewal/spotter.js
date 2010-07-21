/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * @version .1
 */

if(!window['com']) window['com'] = {};
if(!com.yellowsocket) com.yellowsocket = {};

/**
 * @namespace
 * The namespace of this library.
 */
com.yellowsocket.spotter = {};

/************************************ SPOTTER ***********************************/

/**
 * Construct a Spotter object of the specified type with the specified
 * options.  See the specific module documentation for available
 * options.<br/><br/>
 *
 * TODO: tease out the prototypes to save memory
 *
 * @constructor
 * @param {String} type the type the module type associated witht this spotter, e.g. "twitter.search"
 * @param {Object} options a hash of options for the appropriate module, e.g. {searchString: "Justin Beiber"}
 * @throws {Error} An error is thrown if there is a problem loading the module
 */
com.yellowsocket.spotter.Spotter = function(type, options)  {
    com.yellowsocket.spotter.Spotter.instanceCount = (com.yellowsocket.spotter.Spotter.instanceCount === undefined)?1:com.yellowsocket.spotter.Spotter.instanceCount+1;
    var varName =  "so"+com.yellowsocket.spotter.Spotter.instanceCount;
    var spotting = false;
    var lastCallReturned = true;
    var lastScriptTag = null;
    var observers = [];
    var timer = null;
    var module;

    window["com"]["yellowsocket"]["spotter"][varName] = this;

    if(!com.yellowsocket.spotter.modules[type.split(".")[0]] || !com.yellowsocket.spotter.modules[type.split(".")[0]][type.split(".")[1]])
	throw new Error("Spotter: Module " + type + " not found! (Did you remember to include it via a script tag?)");

    try  {
	module = new (window["com"]["yellowsocket"]["spotter"]["modules"][type.split(".")[0]][type.split(".")[1]])(options);
    } catch(e)  {
	throw new Error(e);
    }

    if(!module.url || !module.process)  {
	throw new Error("Spotter: com.yellowsocket.spotter.modules."+type+" is invalid.  (Does it return an object with url and process methods?)");
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
     */
    this.spot = function()  {
	if(!spotting) spotting = true;
	var url;
	var obj = this;

	if(lastCallReturned)  {
	    url = module.url();
	    if(url instanceof Object && url.callbackParam !== undefined)  {
		url = url.url+'&'+url.callbackParam+'=com.yellowsocket.spotter.'+varName+'.callback';
	    }
	    else  {
		url += '&callback=com.yellowsocket.spotter.'+varName+'.callback';
	    }
	    url += '&random='+Math.floor(Math.random()*10000);  //add random number to help avoid caching in safari and chrome
	    request(url);
	}
	if(module.nextTimeout() > 0)  {
	    timer = setTimeout(function() { obj.spot(); }, module.nextTimeout()*1000);
	}
    }
    
    /**
     * Receives the response from the ajax request and send it
     * to the appropriate module for processing.  Removes the
     * defunct script tag from the DOM.  Notifies observers if
     * the module determines there is new data.
     *
     * @private 
     * @param {Object} rawData Unprocessed data direct from the API
     */
    this.callback = function(rawData)  {
	var processedData = module.process(rawData); //send the raw data to the module for processing
	//now the processedData has an 'update' attribute and a 'data' attribute
	if(processedData.update) notifyObservers(processedData.data);

	//here is where we need to set up the next call by getting the delay from the module

	lastCallReturned = true;
    }


    /**
     * Stops this spotter if it is currently spotting.
     *
     * @throws Error An error is thrown if you try to stop a stopped spotter
     */
    this.stop = function()  {
	if(!spotting)  {
	    throw new Error("Spotter: You can't stop a stopped spotter!");
	}
	else  {
	    spotting = false;
	    var head = document.getElementsByTagName("head");
	    if(lastScriptTag !== null) head[0].removeChild(lastScriptTag);
	    clearTimeout(timer);
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
     * @param {Object} observer this object will be notified when new data is available
     * @throws TypeError a TypeError is thrown if the parameter does not implement notify
     */
    this.register = function(observer) {
	if(observer !== undefined && observer.notify !== undefined && typeof observer.notify === 'function')
	    observers.push(observer);
	else if(observer !== undefined && typeof observer === 'function')
	    observers.push(observer);
	else
	    throw new TypeError('Observer must implement a notify method.');
    }
    
    /**
     * Notify this Observable's observers
     *
     * @private
     * @param {Object} data that will be sent to the observers
     */
    var notifyObservers = function(data)  {
	for(var i in observers)  {
	    if(typeof observers[i] === 'object')
		observers[i].notify(data);
	    else if(typeof observers[i] === 'function')
		observers[i](data);
	    else
		throw new Error("observer list contains an invalid object");
	}
    }
    /********** END OBSERVABLE MIXIN ***************/
}//end spotter constructor

/************************************ END SPOTTER ***********************************/

/************************************ MODULES ***********************************/

/**
 * @namespace
 * The module namespace
 */
com.yellowsocket.spotter.modules = {};

/**
 * @constructor
 * The general Module from which everything else inherits
 *
 */
com.yellowsocket.spotter.modules.Module = function(options) {
    var period;

    
    if(options["period"] === undefined)  {
	period = 45;
    }
    else  {
	period = options["period"];
    }

    this.nextTimeout = function()  {
	return period;
    }
}

/************************************ END MODULES ***********************************/

/************************************ UTILS ***********************************/

/**
 * @namespace
 * The util namespace
 */
com.yellowsocket.spotter.util = {};


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
com.yellowsocket.spotter.util.changes = function(a,b)  {
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
com.yellowsocket.spotter.util.complements = function(a, b)  {
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

/************************************ END UTILS ***********************************/
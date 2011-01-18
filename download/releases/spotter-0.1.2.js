/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * @version .1
 *
 * TODO: create a definite,permanant namespace for this library
 */


/**
 * @namespace
 * The namespace of this library.
 */
spotter = {};

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
 * @param {Object} options a hash of options for the appropriate module, e.g. {searchString: "Justing Beiber"}
 * @throws {Error} An error is thrown if there is a problem loading the module
 */
spotter.Spotter = function(type, options)  {
    spotter.Spotter.instanceCount = (spotter.Spotter.instanceCount === undefined)?1:spotter.Spotter.instanceCount+1;
    var varName =  "so"+spotter.Spotter.instanceCount;
    var spotting = false;
    var lastCallReturned = true;
    var lastScriptTag = null;
    var observers = [];
    var timer = null;
    var module;

    window["spotter"][varName] = this;

    if(!spotter.modules[type.split(".")[0]] || !spotter.modules[type.split(".")[0]][type.split(".")[1]])
	throw new Error("Spotter: Module " + type + " not found! (Did you remember to include it via a script tag?)");

    try  {
	module = new (window["spotter"]["modules"][type.split(".")[0]][type.split(".")[1]])(options);
    } catch(e)  {
	throw new Error(e);
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
     *
     */
    this.spot = function()  {
	if(!spotting) spotting = true;
	var url;
	var obj = this;

	if(lastCallReturned)  {
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
	if(observer.notify !== undefined && typeof observer.notify === 'function')
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
	for(var i in observers)
	    observers[i].notify(data);
    }
    /********** END OBSERVABLE MIXIN ***************/
}//end spotter constructor

/************************************ END SPOTTER ***********************************/

/************************************ MODULES ***********************************/

/**
 * @namespace
 * The module namespace
 */
spotter.modules = {};

/**
 * @constructor
 * The general Module from which everything else inherits
 *
 */
spotter.modules.Module = function(options) {
    if(options["frequency"] === undefined)  {
	frequency = 45;
    }
    else  {
	frequency = options["frequency"];
    }

    this.nextTimeout = function()  {
	return frequency;
    }
}

/**
 * @namespace
 * The flickr namespace
 */
spotter.modules.flickr = {};
spotter.modules.flickr.search = function(options)  {
    spotter.modules.Module.call(this,options);    

    if(options == undefined || options.api_key == undefined || (options.searchString == undefined && options.tags == undefined))
	throw new Error("flickr module requires an api_key and a searchString or tags to be defined as an option");

    var api_key = options.api_key;
    var searchString = options.searchString;
    var tags = options.tags;

    var lastTop = {id:-1};  //stupid hack

    
    this.url = function()  {
	var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search';
	url += '&api_key='+api_key+'&format=json&content_type=1';
	if(tags != undefined) url+= '&tags='+escape(tags);
	if(searchString != undefined) url+= '&text='+escape(searchString);
	return {url:url, callbackParam:"jsoncallback"};
    }

    this.process = function(rawData)  {
	var processedData = {};
	processedData.data = [];
	var photos = rawData.photos.photo;
	var i;

	for(i=0; i < photos.length && photos[i].id !== lastTop.id; i++)  {
	    photos[i].url = buildPhotoURL(photos[i]);
	    photos[i].user_url = "http://www.flickr.com/"+photos[i].owner;
	    processedData.data.push(photos[i]);
	}

	lastTop = photos[0];

	processedData.update = (processedData.data.length>0)?true:false;	
	return processedData;
    }

    /** private method that builds a photo URL from a photo object **/
    var buildPhotoURL = function(photo)  {
	var u = "http://farm" + photo.farm + ".static.flickr.com/"+photo.server+"/"+ photo.id + "_" + photo.secret + ".jpg";
	return u;
    }
}


/**
 * @namespace
 * The twitpic namespace
 */
spotter.modules.twitpic = {};
/**
 * Required options: searchString
 * Other available options: ?
 * callback return format: {update, data}
 *
 * There is no twitpic API, this is a modification of the 
 * twitter search API
 *
 * In addition to the normal twitter API response each object
 * includes the following:
 *
 * twitpic_url
 * twitpic_thumbnail_url
 * twitpic_mini_url
 *
 * update: true/false depending on whether there are new tweets
 * data: the tweet objects themselves
 */
spotter.modules.twitpic.search = function(options)  {
    spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.searchString;

    if(searchString === undefined || searchString === "")
	throw new Error("twitpic search module requires searchString to be specified as an option");

    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += refreshURL != ""?refreshURL:'?q='+escape(searchString)+"+twitpic";
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var i;
	var rematch;
	var twitpic_id;
	refreshURL = rawData.refresh_url || "";
	processedData.update = (rawData.results.length>0)?true:false;

	//process rawData and put it in processedData
	processedData.data = [];
	for(i in rawData.results)  {
	    //put the processed version of the raw data in the 
	    //processed data array
	    rematch = /http\:\/\/twitpic.com\/(\w+)/.exec(rawData.results[i].text);
	    if(rematch!== null && !rawData.results[i].text.match(new RegExp("^RT")))  {  //ignore retweets
		twitpic_id = rematch[1];
		rawData.results[i].twitpic_url = "http://twitpic.com/"+twitpic_id;
		rawData.results[i].twitpic_full_url = "http://twitpic.com/show/full/"+twitpic_id;
		rawData.results[i].twitpic_thumb_url = "http://twitpic.com/show/thumb/"+twitpic_id;
		rawData.results[i].twitpic_mini_url = "http://twitpic.com/show/mini/"+twitpic_id;
		processedData.data.push(rawData.results[i]);
	    }
	}
	return processedData;
    }
}

/**
 * @namespace
 * The twitter namespace
 */
spotter.modules.twitter = {};

/**
 * Required options: searchString
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the new tweet objects themselves
 */
spotter.modules.twitter.search = function(options)  {
    spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.searchString;

    if(searchString === undefined || searchString === "")
	throw new Error("twitter search module requires searchString to be specified as an option");
    
    if(!frequency) frequency = MAX_FREQUENCY;  //if not defined, we can do more sophisticated polling

    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += (refreshURL !== "")?refreshURL:'?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	refreshURL = rawData.refresh_url || "";
	processedData.update = (rawData.results.length>0)?true:false;
	processedData.data = rawData.results;
	return processedData;;
    }

};


/**
 * Required options:
 * Other available options: exclude:hashtags
 * callback return format: {added,removed,trends}
 * added: new trends since the last call
 * removed: removed trends since the last call
 * trends: all trends
 */
spotter.modules.twitter.trends = function(options)  {
    spotter.modules.Module.call(this,options);

    var lastTrends;

    this.url = function()  {
	var url = "http://search.twitter.com/trends.json?";
	if(options != undefined && options.exclude != undefined) url+="exclude="+options.exclude;
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var trends = rawData.trends;
	if(lastTrends === null)  {
	    processedData = {data:{"added":rawData.trends, "removed":{}, "trends":rawData.trends}};
	}
	else  {
	    var tempArray = spotter.util.complements(rawData.trends, lastTrends);
	    processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	}
	lastTrends = rawData.trends;
	processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	return processedData;
    }
}

/************************************ END MODULES ***********************************/

/************************************ UTILS ***********************************/

/**
 * @namespace
 * The util namespace
 */
spotter.util = {};


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
spotter.util.changes = function(a,b)  {
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
spotter.util.complements = function(a, b)  {
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
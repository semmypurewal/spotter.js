/**
 * spotter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * @version .1
 *
 * TODO: create a definite,permanant namespace for this library
 */

com = {};
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


if(!com.yellowsocket.spotter.modules.flickr) com.yellowsocket.spotter.modules.flickr = {};
else if(typeof com.yellowsocket.spotter.modules.flickr != "object")
    throw new Error("com.yellowsocket.spotter.modules.flickr is not an object!");

com.yellowsocket.spotter.modules.flickr.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);    

    if(options == undefined || options.api_key == undefined || (options.q == undefined && options.tags == undefined))
	throw new Error("flickr search module requires an api_key and a search string (q) or tags to be defined as an option");

    var api_key = options.api_key;
    var searchString = options.q;
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
	    photos[i].photo_url = "http://www.flickr.com/"+photos[i].owner+"/"+photos[i].id;
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

com.yellowsocket.spotter.modules.flickr.feeds = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var tags = options.tags || null;

    var lastTop = {id:-1};  //stupid hack

    this.url = function()  {
	var url = 'http://api.flickr.com/services/feeds/photos_public.gne?format=json';
	if(tags !== null) url+= '&tags='+escape(tags);
	return {url:url, callbackParam:"jsoncallback"};
    }
    
    this.process = function(rawData)  {
	var processedData = {};
	processedData.data = [];
	var photos = rawData.items;
	var i;

	for(i=0; i < photos.length && photos[i].link !== lastTop.link; i++)  {
	    photos[i].url = photos[i].media.m.replace("_m","");
	    photos[i].user_url = "http://www.flickr.com/"+photos[i].author_id;
	    photos[i].photo_url = photos[i].link;
	    if(photos[i].author.match(/\(([^\)]*)\)/) === null) alert(photos[i].author);
	    photos[i].user_id = photos[i].author.match(/\(([^\)]*)\)/)[1];
	    processedData.data.push(photos[i]);
	}

	lastTop = photos[0];

	processedData.update = (processedData.data.length>0)?true:false;	
	return processedData;
    }
}

if(!com.yellowsocket.spotter.modules.twitpic) com.yellowsocket.spotter.modules.twitpic = {};
else if(typeof com.yellowsocket.spotter.modules.twitpic != "object")
    throw new Error("com.yellowsocket.spotter.modules.twitpic is not an object!");

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
com.yellowsocket.spotter.modules.twitpic.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.q;

    if(searchString === undefined || searchString === "")
	throw new Error("twitpic search module requires a search string (q) to be specified as an option");

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
};

if(!com.yellowsocket.spotter.modules.twitter) com.yellowsocket.spotter.modules.twitter = {};
else if(typeof com.yellowsocket.spotter.modules.twitter != "object")
    throw new Error("com.yellowsocket.spotter.modules.twitter is not an object!");

/**
 * Required options: q
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the new tweet objects themselves
 */
com.yellowsocket.spotter.modules.twitter.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.q;
    var exclude = (options.exclude !== undefined)?options.exclude.split(","):[];
    var i;
    var excludeREString = "";


    if(searchString === undefined || searchString === "")
	throw new Error("twitter search module requires a search string (q) to be specified as an option");

    if(exclude !== undefined)  {
	for(i=0;i < exclude.length; i++)  {
	    if(exclude[i] === "twitpic"||
	       exclude[i] === "tweetphoto")  {
		excludeREString += (excludeREString==="")?exclude[i]:"|"+exclude[i];
	    }
	    else  {
		throw new Error(exclude[i] + " not a valid exclude string, try 'tweetphoto' and/or 'twitpic'");
	    }
	}
    }


    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += (refreshURL !== "")?refreshURL:'?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	refreshURL = rawData.refresh_url || "";

	if(excludeREString === "")  {
	    processedData.data = rawData.results;
	}
	else  {
	    processedData.data = [];
	    //create re

	    var excludeRE = new RegExp(excludeREString);
	    //filter the data
	    for(i in rawData.results)  {
		if(rawData.results[i].text.match(excludeRE) === null)  {
		    processedData.data.push(rawData.results[i]);
		}
		else  {
		    //alert("filtered:"+rawData.results[i].text);
		}
	    }
	}

	processedData.update = (processedData.data.length>0)?true:false;

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
com.yellowsocket.spotter.modules.twitter.trends = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

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
	    var tempArray = com.yellowsocket.spotter.util.complements(rawData.trends, lastTrends);
	    processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	}
	lastTrends = rawData.trends;
	processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	return processedData;
    }
}

if(!com.yellowsocket.spotter.modules.tweetphoto) com.yellowsocket.spotter.modules.tweetphoto = {};
else if(typeof com.yellowsocket.spotter.modules.tweetphoto != "object")
    throw new Error("com.yellowsocket.spotter.modules.tweetphoto is not an object!");

/**
 * Required options: q
 * Other available options: ?
 * callback return format: {update, data}
 *
 * In addition to the normal tweetphoto API response each object
 * includes the following:
 *
 * tweetphoto_url
 * tweetphoto_thumbnail_url
 * tweetphoto_mini_url
 *
 * update: true/false depending on whether there are new tweets
 * data: the tweet objects themselves
 */
com.yellowsocket.spotter.modules.tweetphoto.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var refreshURL = "";
    var searchString = options.q;

    if(searchString === undefined || searchString === "")
	throw new Error("tweetphoto search module requires a search string (q) to be specified as an option");

    this.url = function()  {
	var url = 'http://search.twitter.com/search.json'
	url += refreshURL != ""?refreshURL:'?q='+escape(searchString)+"+tweetphoto";
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};
	var i;
	var rematch;
	var tweetphoto_id;
	refreshURL = rawData.refresh_url || "";
	processedData.update = (rawData.results.length>0)?true:false;

	//process rawData and put it in processedData
	processedData.data = [];
	for(i in rawData.results)  {
	    //put the processed version of the raw data in the 
	    //processed data array
	    rematch = /http\:\/\/tweetphoto.com\/(\w+)/.exec(rawData.results[i].text);
	    if(rematch!== null && !rawData.results[i].text.match(new RegExp("^RT")))  {  //ignore retweets
		tweetphoto_id = rematch[1];
		rawData.results[i].tweetphoto_url = rematch[0];
		rawData.results[i].tweetphoto_full_url = "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=big&url="+rematch[0];
		rawData.results[i].tweetphoto_thumb_url = "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=thumbnail&url="+rematch[0];
		rawData.results[i].tweetphoto_mini_url =  "http://TweetPhotoAPI.com/api/TPAPI.svc/imagefromurl?size=medium&url="+rematch[0];
		processedData.data.push(rawData.results[i]);
	    }
	}
	return processedData;
    }
};

if(!com.yellowsocket.spotter.modules.facebook) com.yellowsocket.spotter.modules.facebook = {};
else if(typeof com.yellowsocket.spotter.modules.facebook != "object")
    throw new Error("com.yellowsocket.spotter.modules.facebook is not an object!");

/**
 * Required options: q
 * Other available options: ?
 * callback return format: {update, data}
 * update: true/false depending on whether there are new tweets
 * data: the new tweet objects themselves
 */
com.yellowsocket.spotter.modules.facebook.search = function(options)  {
    com.yellowsocket.spotter.modules.Module.call(this,options);

    var searchString = options.q;
    var lastCreatedTime = null;
    var i;

    if(searchString === undefined || searchString === "")
	throw new Error("facebook search module requires a search string (q) to be specified as an option");
    
    this.url = function()  {
	var url = 'http://graph.facebook.com/search'
	url += '?q='+escape(searchString);
	return url;
    }

    this.process = function(rawData)  {
	var processedData = {};

	//alert(lastCreatedTime);

	processedData.data = [];
	//filter the data
	for(i in rawData.data)  {
	    if((lastCreatedTime === null || rawData.data[i].created_time > lastCreatedTime) && rawData.data[i].type === 'status')  {
		rawData.data[i].profile_image_url = "http://graph.facebook.com/"+rawData.data[i].from.id+"/picture";
		rawData.data[i].profile_url = "http://www.facebook.com/people/"+rawData.data[i].from.name.replace(" ","-")+"/"+rawData.data[i].from.id;
		processedData.data.push(rawData.data[i]);
	    }
	    else  {
		//alert("filtered:"+rawData.data.results[i].text);
	    }
	}


	lastCreatedTime = rawData.data[0]['created_time'];

	processedData.update = (processedData.data.length>0)?true:false;

	return processedData;;
    }
};

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
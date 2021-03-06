/**
 * spotter.js
 * Copyright (C) 2010-2011 Semmy Purewal
 *
 * @version .2
 */

(function(window)  {
    var spotterjs = {};

    /**
     * Construct a Spotter object of the specified type with the specified
     * options.  See the specific module documentation for available
     * options.
     *
     * @constructor
     * @param {String} type the type the module type associated witht this spotter, e.g. "twitter.search"
     * @param {Object} options a hash of options for the appropriate module, e.g. {searchString: "Justin Beiber"}
     * @throws {Error} An error is thrown if there is a problem loading the module
     */
    spotterjs.Spotter = function(type, options)  {
	spotterjs.Spotter.instanceCount = (spotterjs.Spotter.instanceCount === undefined)?1:spotterjs.Spotter.instanceCount+1;
	var varName =  "_so"+spotterjs.Spotter.instanceCount;
	var spotting = false;
	var lastCallReturned = true;
	var lastScriptTag = null;
	var observers = [];
	var timer = null;
	var module;
	
	window["spotterjs"][varName] = this;
	
	if(!spotterjs.modules[type.split(".")[0]] || !spotterjs.modules[type.split(".")[0]][type.split(".")[1]])
	    throw new Error("Spotter: Module " + type + " not found! (Did you remember to include it via a script tag?)");
	
	try  {
	    module = new (window["spotterjs"]["modules"][type.split(".")[0]][type.split(".")[1]])(options);
	} catch(e)  {
	    throw new Error(e);
	}
	
	if(!module.url || !module.process)  {
	    throw new Error("Spotter: spotterjs.modules."+type+" is invalid.  (Does it return an object with url and process methods?)");
	}


	/**
         * Start spotting.
         *
         * TODO: set up a time out so that if the last request doesn't return 
         *       the remaining requests are not blocked
         */
	this.start = function()  {
	    if(!spotting) spotting = true;
	    var url;
	    var obj = this;
	    
	    if(lastCallReturned)  {
		url = module.url();
		if(url instanceof Object && url.callbackParam !== undefined)  {
		    url = url.url+'&'+url.callbackParam+'=spotterjs.'+varName+'.callback';
		}
		else  {
		    url += '&callback=spotterjs.'+varName+'.callback';
		}
		url += '&random='+Math.floor(Math.random()*10000);  //add random number to help avoid caching in safari and chrome
		request(url);
	    }
	    if(module.nextTimeout() > 0)  {
		timer = setTimeout(function() { obj.start(); }, module.nextTimeout()*1000);
	    }
	}
    
	/**
         * Receives the response from the ajax request and send it
         * to the appropriate module for processing.  Notifies
         * observers if the module determines there is new data.
         *
         * @param {Object} rawData Unprocessed data direct from the API
         */
	this.callback = function(rawData)  {
	    var processedData = module.process(rawData); //send the raw data to the module for processing
	    //now the processedData has an 'update' attribute and a 'data' attribute
	    if(processedData.update) {
		notifyObservers(processedData.data);
	    }
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
		if(lastScriptTag) {
		    head[0].removeChild(lastScriptTag);
		}
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
	    if(lastScriptTag) {
		head[0].removeChild(lastScriptTag);
	    }
	    head[0].appendChild(script);
	    lastScriptTag = script;
	}
    
	/**
         * Register an observer with this object
         *
         * @param {Object} observer this object will be notified when new data is available
         * @throws TypeError a TypeError is thrown if the parameter does not implement notify
         */
	this.register = function(observer) {
	    if(observer !== undefined && observer.notify !== undefined && typeof observer.notify === 'function')  {
		observers.push(observer);
	    } else if(observer !== undefined && typeof observer === 'function')  {
		observers.push(observer);
	    } else  {
		throw new TypeError('Observer must implement a notify method.');
	    }
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
    }//end spotter constructor

    /************************************ END SPOTTER ***********************************/



    /************************************ UTILS ***********************************/

    /**
     * @namespace
     * The util namespace
     */
    spotterjs.util = {};


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
    spotterjs.util.changes = function(a,b)  {
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
     * TODO: make more general (for arbitrary arrays)
     * TODO: use the changes algorithm as a subroutine
     *
     */
    spotterjs.util.complements = function(a, b)  {
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


    /************************************ MODULES ***********************************/
    /**
     * @namespace
     * The module namespace
     */
    spotterjs.modules = {};

    /**
     * @constructor
     * The general Module from which everything else inherits
     */
    spotterjs.modules.Module = function(options) {
	var period = options.period || options.timeout || 45;
	
	this.nextTimeout = function(t)  {
	    if(t)  {
		period = t;
	    } else  {
		return period;
	    }
	}
    }
    /************************************ END MODULES ***********************************/

    //namespace shortcut
    window.spotterjs = spotterjs;
    window.Spotter = spotterjs.Spotter;
})(window);
/**
 * spotter.delicious.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: implement hotlist feed, should be very easy
 *
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotterjs not yet loaded!");
    
    if(!spotterjs.util)
	throw new Error("spotterjs.util not yet loaded!");

    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");


    if(!spotterjs.modules.delicious)
	spotterjs.modules.delicious = {};
    else if(typeof spotterjs.modules.delicious != "object")
	throw new Error("spotterjs.modules.delicious is not an object!");


    spotterjs.modules.delicious.recent = function(options)  {
	spotterjs.modules.Module.call(this,options);

	var lastTop;
	this.url = function()  {
	    var url = 'http://feeds.delicious.com/v2/json/recent/?count=100';
	    return url;
	}

	this.process = function(data)  {
	    var processedData = {};
	    if(lastTop === undefined)  {
		lastTop = data[0];
		processedData = {data:data, update:true};
	    }
	    else if(lastTop["u"] === data[0]["u"])  {
		processedData = {data:data, update:false};
	    }
	    else  {
		pops = data.length - find(lastTop, data);
		for(var i = 0; i < pops; i++) data.pop();
		processedData = {data:data, update:true};
		lastTop = data[0];
	    }
	    return processedData;
	}

	var find = function (item, array)  {
	    for(var i = 0; i < array.length; ++i)  {
		if(array[i]["u"] === item["u"]) return i;
	    }
	    return array.length;
	}
    }//end recent module

    /**
     * Required options: tags
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new bookmarks
     * data: the bookmark objects themselves
     *
     * @constructor
     */
    spotterjs.modules.delicious.tags = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
	var tags = options.tags;
	
	if(tags === undefined || tags === "")
	    throw new Error("delicious tags module requires tags to be specified as an option");	
	
	var lastTop;

	this.url = function()  {
	    var url = 'http://feeds.delicious.com/v2/json/tag/'+tags+'?count=100';
	    return url;
	}
	
	/**
         * process delicious data
         *
         * @param data This is the raw data from Spotter
         */
	this.process = function(data)  {
	    var processedData = {};
	    if(lastTop === undefined)  {
		lastTop = data[0];
		processedData = {data:data, update:true};
	    }
	    else if(lastTop["u"] === data[0]["u"])  {
		processedData = {data:data, update:false};
	    }
	    else  {
		pops = data.length - find(lastTop, data);
		for(var i = 0; i < pops; i++) data.pop();
		processedData = {data:data, update:true};
		lastTop = data[0];
	    }
	    return processedData;
	}
	
	var find = function (item, array)  {
	    for(var i = 0; i < array.length; ++i)  {
		if(array[i]["u"] === item["u"]) return i;
	    }
	    return array.length;
	}
    }
})(window);
/**
 * spotter.facebook.js
 * Copyright (C) 2010 Semmy Purewal
 *
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotter not yet loaded!");
    
    if(!spotterjs.util)
	throw new Error("spotter.util not yet loaded!");

    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");
    
    if(!spotterjs.modules.facebook) spotterjs.modules.facebook = {};
    else if(typeof spotterjs.modules.facebook != "object")
	throw new Error("spotterjs.modules.facebook is not an object!");

    /**
     * Required options: q
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new tweets
     * data: the new tweet objects themselves
     */
    spotterjs.modules.facebook.search = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
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
    }
})(window);
/**
 * spotter.flickr.js
 * Copyright (C) 2010 Semmy Purewal
 *
 *
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotter not yet loaded!");

    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");

    if(!spotterjs.modules.flickr) spotterjs.modules.flickr = {};
    else if(typeof spotterjs.modules.flickr != "object")
	throw new Error("spotterjs.modules.flickr is not an object!");

    spotterjs.modules.flickr.search = function(options)  {
	spotterjs.modules.Module.call(this,options);    
	
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

    spotterjs.modules.flickr.feeds = function(options)  {
	spotterjs.modules.Module.call(this,options);

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
})(window);
/**
 * spotter.identica.js
 * Copyright (C) 2010 Semmy Purewal
 *
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotterjs not yet loaded!");

    if(!spotterjs.util)
	throw new Error("spotterjs.util not yet loaded!");

    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");

    if(!spotterjs.modules.identica) spotterjs.modules.identica = {};
    else if(typeof spotterjs.modules.identica != "object")
	throw new Error("spotterjs.modules.identica is not an object!");

    /**
     * Required options: q (searchString)
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new tweets
     * data: the tweet objects themselves
     *
     * TODO: Once statusnet completely implements its Twitter Compatible API
     *       this should work just like the twitter module.  It may be possible
     *       to merge the two modules somehow.
     */
    spotterjs.modules.identica.search = function(options)  {
	spotterjs.modules.Module.call(this,options);

	var refreshURL = "";
	var searchString = options.q;
	
	
	var lastID = 0;  //this is a temporary fix until since_id is properly implemented
	
	if(searchString === undefined || searchString === "")
	    throw new Error("identica search module requires a search string (q) to be specified as an option");

	this.url = function()  {
	    var url = 'http://identi.ca/api/search.json';
	    url += refreshURL != ""?refreshURL:'?q='+escape(searchString);
	    return url;
	}

	this.process = function(rawData)  {
	    var processedData = {};
	    var i;
	    
	    processedData.data = [];
	    refreshURL = rawData.refresh_url;
	    
	    if(rawData.results.length>0)  {
		processedData.update = true;
		for(i = 0; i < rawData.results.length && rawData.results[i].id > lastID; ++i)  {
		    processedData.data.unshift(rawData.results[i]);
		}
		lastID = rawData.results[0].id;
	    }
	    else  {
		processedData.update = false;
	    }
	    
	    return processedData;;
	}
    };

    spotterjs.modules.identica.realtimesearch = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
	var searchString = options.q;
	var lastID = 0;  //this is a temporary fix until since_id is properly implemented
	var currentCount=1000;
	var counts = [0,0,currentCount];
	
	if(searchString === undefined || searchString === "")
	    throw new Error("identica search module requires searchString to be specified as an option");
	
	this.url = function()  {
	    var url = 'http://identi.ca/api/statuses/public_timeline.json?count='+currentCount;
	    return url;
	}

	this.process = function(rawData)  {
	    var processedData = {};
	    var i;
	    
	    if(lastID > 0)  {
		counts.push(rawData[0].id-lastID);
		counts.shift();
		currentCount = Math.ceil((counts[0]+counts[1]+counts[2])/3)+10;
	    }
	    
	    processedData.data = [];

	    if(rawData.length>0)  {
		for(i = 0; i < rawData.length && rawData[i].id > lastID; ++i)  {
		    if(rawData[i].text.match(new RegExp(searchString,"i")))  {
			processedData.data.unshift(rawData[i]);
		    }
		}
		lastID = rawData[0].id;
		processedData.update = processedData.data.length===0?false:true;
	    }
	    else  {
		processedData.update = false;
	    }
	    return processedData;;
	}
    }
})(window);
/**
 * spotter.twitpic.js
 * Copyright (C) 2010 Semmy Purewal
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotterjs not yet loaded!");

    if(!spotterjs.util)
	throw new Error("spotterjs.util not yet loaded!");

    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");

    if(!spotterjs.modules.twitpic) spotterjs.modules.twitpic = {};
    else if(typeof spotterjs.modules.twitpic != "object")
	throw new Error("spotterjs.modules.twitpic is not an object!");

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
    spotterjs.modules.twitpic.search = function(options)  {
	spotterjs.modules.Module.call(this,options);

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
    }
})(window);
/**
 * spotter.twitter.js
 * Copyright (C) 2010 Semmy Purewal
 *
 * TODO: test trend module more carefully
 *
 */

(function(window)  {

    if(!spotterjs)
	throw new Error("spotterjs not yet loaded!");
    
    if(!spotterjs.util)
	throw new Error("spotterjs.util not yet loaded!");
    
    if(!spotterjs.modules) spotterjs.modules = {};
    else if(typeof spotterjs.modules != "object")
	throw new Error("spotterjs.modules is not an object!");
    
    if(!spotterjs.modules.twitter) spotterjs.modules.twitter = {};
    else if(typeof spotterjs.modules.twitter != "object")
	throw new Error("spotterjs.modules.twitter is not an object!");

    /**
     * Required options: q
     * Other available options: ?
     * callback return format: {update, data}
     * update: true/false depending on whether there are new tweets
     * data: the new tweet objects themselves
     */
    spotterjs.modules.twitter.search = function(options)  {
	spotterjs.modules.Module.call(this,options);

	var refreshURL = "";
	var searchString = options.q;
	var exclude = (options.exclude !== undefined)?options.exclude.split(","):[];
	var lang = options.lang;
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
	    url += (lang)?'&lang='+lang:'';
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
    spotterjs.modules.twitter.trends = function(options)  {
	spotterjs.modules.Module.call(this,options);
	
	var lastTrends;
	
	this.url = function()  {
	    var url = "http://api.twitter.com/trends.json?";
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
		var tempArray = spotterjs.util.complements(rawData.trends, lastTrends);
		processedData = {data:{"added":tempArray[0],"removed":tempArray[1], "trends":rawData.trends}};
	    }
	    lastTrends = rawData.trends;
	    processedData.update = (processedData.data.added.length>0||processedData.data.removed.length>0)?true:false;
	    return processedData;
	}
    }
})(window);

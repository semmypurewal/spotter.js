/**
 * spotter.flickr.js
 * Copyright (C) 2010 Semmy Purewal
 *
 *
 */

if(!com.yellowsocket.spotter)
    throw new Error("com.yellowsocket.spotter not yet loaded!");

if(!com.yellowsocket.spotter.modules) com.yellowsocket.spotter.modules = {};
else if(typeof com.yellowsocket.spotter.modules != "object")
    throw new Error("com.yellowsocket.spotter.modules is not an object!");

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
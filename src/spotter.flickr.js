/**
 * spotter.flickr.js
 * Copyright (C) 2010 Semmy Purewal
 */

if(!spotter)
    throw new Error("spotter not yet loaded!");

if(!spotter.modules) spotter.modules = {};
else if(typeof spotter.modules != "object")
    throw new Error("spotter.modules is not an object!");

if(!spotter.modules.flickr) spotter.modules.flickr = {};
else if(typeof spotter.modules.flickr != "object")
    throw new Error("spotter.modules.flickr is not an object!");

spotter.modules.flickr.search = function(options)  {
    if(options == undefined || options.api_key == undefined || (options.searchString == undefined && options.tags == undefined))
	throw new Error("flickr module requires an api_key and a searchString or tags to be defined as an option");

    var api_key = options.api_key;
    var searchString = options.searchString;
    var tags = options.tags;
    
    
    var url = function()  {
	var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search';
	url += '&api_key='+api_key+'&format=json&content_type=1';
	if(tags != undefined) url+= '&tags='+escape(tags);
	if(searchString != undefined) url+= '&text='+escape(searchString);
	return {url:url, callbackParam:"jsoncallback"};
    }

    var callback = function(rawData)  {
	var processedData = {};
	var photos = rawData.photos.photo;
	//build the url for each photo before we send it back
	for(i in photos)  {
	    photos[i].url = buildPhotoURL(photos[i]);
	    photos[i].user_url = "http://www.flickr.com/"+photos[i].owner;
	}
	processedData.update = (photos.length>0)?true:false;	
	processedData.data = photos;
	return processedData;
    }


    /** private method that builds a photo URL from a photo object **/
    function buildPhotoURL(photo)  {
	var u = "http://farm" + photo.farm + ".static.flickr.com/"+photo.server+"/"+ photo.id + "_" + photo.secret + ".jpg";
	return u;
    }



    var module = {};
    module.url = url;
    module.callback = callback;
    return module;
}
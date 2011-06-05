# Spotter
Spotter is a JSONP polling library designed for browser-based real-time applications and mashups. It lets you easily add twitter (and other) feeds to simple client-side web pages.

### Features

* Current support for Twitter (search and trends), Facebook (search), Flickr (search), and Delicious (recents and tags)
Completely client-side
* "Real-time" and flexible (although you should consult the Spotter documentation and the API documentation before changing the defaults)
* Extendible to arbitrary JSON feeds

See the examples for more detailed code, but -- seriously -- this is all that's necessary:

    //create your spotter
    var s = new Spotter("twitter.search",{q:"Justin Bieber"});

    //register your observer
    s.register(function(tweets) {
        alert(tweets[0].text);  //alert the first returned tweet
    });

    //start BieberSpotting!
    s.start(); 

That's all there is to it!

## Documentation

### Namespace

Spotter adds two items to the global namespace: `spotterjs` (the object that keeps all spotter-related variables) and `Spotter` which is the constructor used to create new spotter objects.

### Basics

Every Spotter object is created as follows:

    //create your spotter
    var s = new Spotter(module_name,options_object);

Here, module_name is a String representing the name of the module and options_object is a a JSON object of options associated with that module. For example, to create a spotter object that watches for new english tweets relating to Justin Bieber, you would do the following:

    //create your spotter
    var s = new Spotter("twitter.search",{q:"Justin Bieber", lang:"en"});

To get something to happen when new tweets about Justin Bieber arrive, you need to register a callback function to handle the new tweets. You can do that with an anonymous callback function, a callback function variable or with an object that implements a notify method (as per the observer design pattern). In the following example we register an anonymous function that alerts all of the latest tweets:

    //register your observer
    s.register(function(tweets) {
        for(var t in tweets)  {
            alert(tweets[t].text);
        }
    });

Usually you'll want to insert the tweets (or other data) into the DOM instead of alerting them. I use jQuery to do this in some of the examples.

Last, but not least, once you register create your object and register your method, you want to start your spotter. To do this, simply call the `start` method. Later, if you want to kill your spotter, simply call the stop method.

    s.start();  //start your spotter

    //....

    s.stop();  //stop your spotter if necessary


### Modules

Every module allows you to specify the polling timeout, or the `period`, as an option. If you use `period:0` as an option, spotter will only make the request once. In general, you don't want to use a polling frequency of more than 4 times a minute (or `period:15`) or your app might get rate-limited.

#### Twitter

`twitter.search`: requires the q option which is a search string. You can also specify a language with the lang options. I usually use lang:"en" to specify retrieving english language tweets.

`twitter.trends`: no required options, but you can specify exclude:hashtags to ignore trending hashtags (hashtags are metadata appear in tweets as words with a # in front of them)

#### Facebook

`facebook.search`: required option is q which is a search string.

#### Flickr

Note that the Flickr module requires you to obtain and register a flickr API key for your App. You can get one by logging in with your yahoo account here. Note that flickr's feeds are not updated in real-time, so you might want to use period:0 as an option (see above).

`flickr.search`: required options are api-key and q which is a search string. You can also search for certain tags.

`flickr.feeds`: required options are api-key. With no other options, you just get the public timeline, but you can also specify tags.

#### Twitpic

The twitpic module searches twitter for twitpic tweets associated with your search term and then returns an object that includes the usual twitter data plus URL tags for the images.

`twitpic.search`: required option is q which is a search string.

#### Delicious

`delicious.recents`: no required options, gets the most recently bookmarked sites

`delicious.tags`: required option is tags which is a series of tags to search for
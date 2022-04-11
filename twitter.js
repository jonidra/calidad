!(function(global) {

  // Base URL for the "twitter" API
  const TWITTER_BASE_URL = "https://twitter-usj-default-rtdb.europe-west1.firebasedatabase.app/tweets/"
    // Categories to show tweets for
  var CATEGORIES = ["food", "music", "sports", "nfl"];

  // Mark current tweeet and current category of tweets
  var currentTweet = 0;
  var currentCategory = 0;

  // Keep track of the key info from downloaded tweets for selected category
  var tweets = [];

  /* Get the tweets for a given category */
  var getCategory = function(category) {
    var tweetsXHR = new XMLHttpRequest();
    tweetsXHR.addEventListener("load", onTweetsReceived);
    tweetsXHR.open("GET", TWITTER_BASE_URL + CATEGORIES[category] + '.json');
    tweetsXHR.send();
  }

  /* Callback to be invoked when tweets for the category are received */
  var onTweetsReceived = function() {
    tweetResponse = JSON.parse(this.responseText);
    // We filter the tweets so we only use the ones with videos
    // and we keep only the basic info from every tweet
    tweets = getTweetsDisplayInfo(getTweetsWithVideos(tweetResponse));
    currentTweet = 0;
    showTweet(currentTweet);
  }

  /* Show the category title */
  var showCategoryTitle = function(category) {
    document.getElementById("category").innerHTML = category;
  }

  /* Filter tweets to get only those with proper video info*/
  var getTweetsWithVideos = function(tweets) {
    return tweets.filter(function(t) {
      if (t.extended_entities &&
        t.extended_entities.media &&
        t.extended_entities.media[0] &&
        t.extended_entities.media[0].video_info) {
        return true;
      } else {
        return false;
      }
    });
  }

  /* Extracts the relevant information amongst the whole twitter info */
  var getTweetsDisplayInfo = function(tweets) {
    return tweets.map(function(t) {
      var tweetDisplayInfo = {};
      tweetDisplayInfo.created_at = t.created_at;
      tweetDisplayInfo.text = t.full_text;
      tweetDisplayInfo.user_screen_name = '@' + t.user.screen_name;
      tweetDisplayInfo.media_url = t.extended_entities.media[0].media_url;
      tweetDisplayInfo.video_url = getBestVideo(t.extended_entities.media[0].video_info.variants);
      tweetDisplayInfo.video_resolution = t.extended_entities.media[0].sizes.large;
      return tweetDisplayInfo;
    });
  }

  /* Gets the video Url with the best quality.
     This is necessary because tweets include multiple
     video urls with different qualities */
  var getBestVideo = function(mediaVariants) {
    var mp4Videos = getMp4Videos(mediaVariants);
    var max = mp4Videos.reduce(function(prev, current) {
      // The higher bitrate, the better quality
      if (+current.bitrate > +prev.bitrate) {
        return current;
      } else {
        return prev;
      }
    });
    return max.url;
  }

  /* Gets the videos with mp4 format from the available ones.
     We need this helper because not all the videos are in
     mp4 and non-mp4 are not playable */
  var getMp4Videos = function(videos) {
    return videos.filter(function(video) {
      if (video.content_type == 'video/mp4') {
        return true;
      } else {
        return false;
      }
    });
  }

  /* Renders a tweet from the list based on the index */
  var showTweet = function(index) {
    document.getElementById("user_screen_name").innerHTML = tweets[index].user_screen_name;
    document.getElementById("text").innerHTML = tweets[index].text;
    document.getElementById("created_at").innerHTML = tweets[index].created_at;
    document.getElementById("media_url").style["background-image"] = "url(" + tweets[index].media_url + ")";
    document.getElementById("video").setAttribute('height', tweets[index].video_resolution.h);
    document.getElementById("video").setAttribute('width', tweets[index].video_resolution.w);
    document.getElementById("video").setAttribute('poster', tweets[index].media_url);
    document.getElementById("video").setAttribute('src', tweets[index].video_url);
    showCategoryTitle(CATEGORIES[currentCategory])
    makeVisible();
  }

  /* Shows the tweet info when the video is not playing */
  var makeVisible = function() {
    var invisibles = document.getElementsByClassName('invisible');
    for (var i = 0; i < invisibles.length; i++) {
      invisibles[i].classList.add('visible');
      invisibles[i].classList.remove('invisible');
    }
  }

  /* Hides the tweet info when the video is not playing */
  var makeInvisible = function() {
    var visibles = document.getElementsByClassName('visible');
    for (var i = 0; i < visibles.length; i++) {
      visibles[i].classList.add('invisible');
      visibles[i].classList.remove('visible');
    }
  }

  /* Handles the key press event:
     Enter (13): Start/Stop video
     Left (37): Previous tweet
     Right (39): Next tweet
     Down (40): Next category
     Up (38): Previous category */
  var keyDown = function(ev) {
    switch (ev.keyCode) {
      case 37:
        showPreviousTweet();
        break;
      case 39:
        showNextTweet();
        break;
      case 40:
        showNextCategory();
        break;
      case 38:
        showPreviousCategory();
        break;
      case 13:
        onPressOk();
        break;
      default:
        break;
    }
  }

  /* plays/pauses current video streaming. If there is no video playing, it starts it */
  var onPressOk = function() {
    var videoElement = document.getElementById("video");
    videoElement.paused ? videoElement.play() : videoElement.pause();
    videoElement.onplay = makeInvisible;
    videoElement.onpause = makeVisible;
    videoElement.onended = makeVisible;
  }

  /* Pauses current video (if not paused)*/
  var pauseVideo = function() {
    var videoElement = document.getElementById("video");
    if (!videoElement.paused) {
      videoElement.pause();
    }
  }

  /* Shows the previous tweet (if any) */
  var showPreviousTweet = function() {
    if (currentTweet > 0) {
      pauseVideo();
      currentTweet--;
      showTweet(currentTweet);
    }
  }

  /* Shows the next tweet (if any) */
  var showNextTweet = function() {
    if (currentTweet < tweets.length - 1) {
      pauseVideo();
      currentTweet++;
      showTweet(currentTweet);
    }
  }

  /* Changes the category of tweets to the previous one (if any) */
  var showPreviousCategory = function() {
    if (currentCategory > 0) {
      pauseVideo();
      currentTweet = 0;
      currentCategory--;
      getCategory(currentCategory);
    }
  }

  /* Changes the category of tweets to the next one (if any) */
  var showNextCategory = function() {
    if (currentCategory < CATEGORIES.length - 1) {
      pauseVideo();
      currentTweet = 0;
      currentCategory++;
      getCategory(currentCategory);
    }
  }

  // Upon start we...
  // 1 - Add the listener for key press events
  // 2 - Request the tweets for the first category (when retrieved the first tweet is shown)
  window.onkeydown = keyDown;
  getCategory(currentCategory);

}(this));

var scaling = new (require('blaast/scaling').Scaling)();

// Require and initialize Facebook API. For appId and appSecret,
// insert your Facebook Application's information.
//
// On setting up your Facebook application:
// http://devsupport.blaast.com/kb/sdk/using-the-facebook-api-part-1-setup 
//
// Initializing the Facebook API will add an object 'facebook' to the client object.

// --- When done, remove these lines
log.warn('You need to insert your Facebook application\'s appId and appSecret to backend.js.');
log.warn('Please follow the instructions in http://devsupport.blaast.com/kb/sdk/using-the-facebook-api-part-1-setup');
// --- When done, remove these lines

require('facebook').init({
	appId: 'put your appId here',
	appSecret: 'put your appSecret here',
	scope: ['read_stream', 'read_requests', 'publish_stream', 'user_photos', 'friends_photos']
});

var clients = {};
app.realtime(function(client, event) {
	if (event === 'CONNECTED') {
		clients[client.user.id] = client;
		// To require another connection attempt, use client.facebook.logout()
		// Needed if you want to change the scope of the authorization.
		// client.facebook.logout();
	} else if (event === 'DISCONNECTED') {
		delete clients[client.user.id];
	}
});

app.message(function(client, action, data) {
	if (action === 'sync') {
		console.log('Client asking for sync, fetching from FB.');

		// Retrieve current user's profile with client.facebook.profile()
		client.facebook.profile(function(err, data) {
			if (err) {
				log.warn('Failed to fetch profile from Facebook.');
				return;
			}

			client.msg('profile-name', { name: data.name });
		});

		// Retrieve current user's friends list with client.facebook.friends()
		client.facebook.friends(function(err, data) {
			if (err) {
				log.warn('Failed to fetch friends from Facebook.');
				return;
			}

			client.msg('friends', data);
		});
	} else
	if (action === 'post') {
		// Post to wall with client.facebook.post()
		client.facebook.post(data.message, function(err, result) {
			log.info('Posted to Facebook with err: ' + JSON.stringify(err));
			log.info('Posted to Facebook with result: ' + JSON.stringify(result));
		});
	}
});

// Serve Facebook profile pictures:
// - request.id is in form 'pic/facebook-id'.
// - client.facebook.picture(id) will fetch a profile photo URL with a facebook id.

app.setResourceHandler(function(request, response) {
	function fail(msg) {
		console.log(msg);
		response.failed(msg);		
	}

	if (request.id.substring(0, 4) === 'pic/') {
		var id = request.id.substring(4);

		var client = clients[request.owner];
		if (client) {
			// Fetch the profile photo URL by facebook id
			client.facebook.picture(id, function(err, url) {
				if (!err) {
					// Fetch the actual photo and scale it to 40x40
					scaling.scale(url, 40, 40, 'image/jpeg', function(err, data) {
						if (!err) {
							// Reply back with the photo data
							response.reply('image/jpeg', data);
						} else {
							fail('Could not fetch photo with url='+ url);
						}
					});
				} else {
					fail('Could not fetch photo for id=' + id);
				}
			});
		} else {
			fail('Request from unknown client');
		}
	} else {
		fail('Unknown request.');
	}
});

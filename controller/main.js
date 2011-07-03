var ImageView = require('ui').ImageView;

var app = this;

exports[':keypress'] = function(key) {
	this.get('input').emit('keypress', key);
};

exports[':load'] = function() {
	var input = this.get('input');
	input.on('submit', function() {
		if (input !== '') {
			app.msg('post', {
				message: input.value()
			});
		}
		input.value('');	
	});
};

exports[':resized'] = function(width, height) {
	this.get('grid').setColumnCount(width/40);
};

exports.setName = function(name) {
	this.get('name').label(name);
};

exports.handleFriends = function(arr) {
	var grid = this.get('grid');

	grid.setEntrySize(40, 40);
	grid.setColumnCount(6);
	
	for (var n=0; n < arr.length && n < 36; n++) {
		var friend = arr[n];
		console.log('adding friend: ' + friend.id);

		var image = new ImageView({
			style: {
				width: 40,
				height: 40
			}
		});
		image.resource('pic/' + friend.id);

		grid.add(image);
	}
};

app.on('connected', function() {
	console.log('Connected to backend.');
	app.msg('sync');
});

app.on('message', function(action, data) {
	if (action === 'profile-name') {
		app.view('main').setName(data.name + '\'s friendgrid');
	}
	if (action === 'friends') {
		app.view('main').handleFriends(data);
	}
});

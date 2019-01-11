/**
 * @modal-video-player
 * Video Player
 *
 * Author: Juan Tabares
 */
(function (document, root, _, undefined) {
	'use strict';

	function ModalVideoPlayerPlugin(options) {
		var self = this;

		self.body = document.querySelector('body');
		self.options = _.assign({
			videoOptions: {
				autoplay: btoa('1'),
				controls: btoa('1'),
			}
		}, options);
	}

	ModalVideoPlayerPlugin.prototype = {
		load: function () {
			var self = this;
			self.setupVideoPlayer();
		},
		unload: function () {
			var self = this;

			if (self.player) {
				self.player.pause();
				self.player.dispose();
			}
		},
		setupVideoPlayer: function () {
			var self = this;

			self.parameters = self.getParametersFromUrl();

			if (_.isNullOrWhiteSpace(self.parameters.ID)) {
				return;
			}

			// setup basic html form of the video player
			_.appendToElement(self.body, self.getHtml(self.parameters));

			// start the player with videojs
			self.videoWrapper = new root.VideoWrapper(self.parameters.ID, self.parameters);
		},
		getParametersFromUrl: function() {
			var self = this;

			var query = root.location.search.substring(1);
			var options = _.assign(self.options.videoOptions,
				_.getParamsFromUrl(query));

			return _.assign({}, {
				ID: atob(options.refid),
				URL: atob(options.ref),
				RESUME: atob(options.resume),
				AUTOPLAY: atob(options.autoplay),
				CONTROLS: atob(options.controls),
				QUALITY: atob(options.quality),
				HOTKEYS: atob(options.hotkeys),
				WIDTH: root.innerWidth - 15,
				HEIGHT: root.innerHeight - 18,
				// Attach events
				onProgressReport: self.onProgressReport.bind(self)
			});
		},
		onProgressReport: function(payload) {
			var self = this;

			root.parent.postMessage({
				'target': 'onVideoProgressEvent',
				'message': payload
			}, '*');
		},
		getHtml: function(params) {
			var tmpl = document.getElementById('tmpl-video-player').innerHTML;

			return _.replaceWithOptions(tmpl,
				/\{ID\}|\{URL\}|\{WIDTH\}|\{HEIGHT\}|\{VIDEOOPTIONS\}|\{KIND\}/g,
				params
			);
		}
	};

	root.modalVideoPlayerPlugin = new ModalVideoPlayerPlugin();

	window.addEventListener('load', function (event) {
		root.modalVideoPlayerPlugin.load();
		console.log('[Modal Video] load');
	});

	window.addEventListener('beforeunload', function (event) {
		root.modalVideoPlayerPlugin.unload();
		console.log('[Modal Video] unload');
	});

}(document, window, VideoUtils));

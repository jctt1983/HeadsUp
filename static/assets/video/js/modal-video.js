/**
 * @modal-video
 * provide the modal video functionality
 *
 * Author: Juan Tabares
 */
(function (document, root, _, undefined) {
	'use strict';

	function ModalVideoPlugin(options) {
		var self = this;

		self.body = document.querySelector('body');
		self.videoParams = {};
		self.options = _.assign({
			animationSpeed: 300,
			videoPlayerUrl: '/static/assets/video/player/'
		}, options);

		self.init();
	}

	ModalVideoPlugin.prototype = {
		init: function () {
			var self = this;

			self.setupModalButtons();
			self.autoLaunchVideo();
		},
		setupModalButtons: function () {
			var self = this;

			var btns = document.querySelectorAll('[data-modal-video]');

			if (!btns || !btns.length) {
				return;
			}

			for (var i = 0; i < btns.length; i++) {
				var btn = btns[i];

				if (_.isNullOrWhiteSpace(btn.getAttribute('data-modal-video'))) {
					continue;
				}

				var params = self.getVideoParams(btn);

				self.videoParams[params.ID] = params;

				btn.addEventListener('click', self.launchVideo.bind(self, params));
			}
		},
		autoLaunchVideo: function () {
			var self = this;

			var hashLocation = root.location.hash.replace('#', '');

			if (_.isNullOrWhiteSpace(hashLocation)) {
				return;
			}

			if (!self.videoParams.hasOwnProperty(hashLocation)) {
				return;
			}

			var params = self.videoParams[hashLocation];

			setTimeout(self.launchVideo.bind(self, params));
		},
		launchVideo: function(params, e) {
			!!e && !!e.preventDefault && e.preventDefault();

			var self = this;

			var modalHtml = self.getModalHtml(params);
			_.appendToElement(self.body, modalHtml);

			var modal = document.getElementById('modal-video-dialog');
			var closeBtn = document.getElementById('modal-video-dismiss-btn');

			modal.addEventListener('click', self.closeModal.bind(self, params));
			closeBtn.addEventListener('click', self.closeModal.bind(self, params));

			setTimeout(function () {
				modal.focus();
			});
		},
		closeModal: function(params, e) {
			!!e && !!e.preventDefault && e.preventDefault();

			var self = this;

			var modal = document.getElementById('modal-video-dialog');
			var btn = document.getElementById(params.ID);

			// gracefully close the modal dialog
			_.addClass(modal, 'modal-video-close');

			setTimeout(function () {
				_.removeElement(modal);
				btn.focus();
			}, self.options.animationSpeed);
		},
		getVideoParams: function (element) {
			var self = this;

			var id = element.getAttribute('id'),
				url = element.getAttribute('data-modal-video');

			if (_.isNullOrWhiteSpace(id)) {
				id = 'modal-video' + _.getHashCode(root.location.pathname + url);
				element.setAttribute('id', id);
			}

			var opt = _.assign({}, {
				ID: id,
				URL: url,
				AUTOPLAY: element.getAttribute('data-modal-video-autoplay') || '1',
				CONTROLS: element.getAttribute('data-modal-video-controls') || '1',
				RESUME: element.getAttribute('data-modal-video-resume') || '1',
				ANALYTICS: element.getAttribute('data-modal-video-analytics') || '1',
				ANALYTICS_ID: element.getAttribute('data-modal-video-analytics-id') || '',
				QUALITY: element.getAttribute('data-modal-video-quality') || 'auto',
				HOTKEYS: element.getAttribute('data-modal-video-hotkeys') || '1',
				IFRAMEOPTIONS: 'allow="autoplay;" data-custom="1" webkitallowfullscreen mozallowfullscreen allowfullscreen',
			});

			if (opt.URL.indexOf('youtube.com') > 0 ||
				opt.URL.indexOf('youtube-nocookie.com') > 0 ||
				opt.URL.indexOf('vimeo.com') > 0 ||
				opt.URL.indexOf('facebook.com') > 0 ||
				opt.URL.indexOf('prezi.com') > 0) {
				// nothing to do
			} else {
				opt.URL = self.options.videoPlayerUrl +
					'?ref=' + encodeURIComponent(btoa(opt.URL)) +
					'&refid=' + encodeURIComponent(btoa(opt.ID)) +
					'&autoplay=' + encodeURIComponent(btoa(opt.AUTOPLAY)) +
					'&controls=' + encodeURIComponent(btoa(opt.CONTROLS)) +
					'&resume=' + encodeURIComponent(btoa(opt.RESUME)) +
					'&quality=' + encodeURIComponent(btoa(opt.QUALITY)) +
					'&hotkeys=' + encodeURIComponent(btoa(opt.HOTKEYS)) +
					'&t=' + (new Date()).getTime();
			}

			return opt;
		},
		getModalHtml: function (params) {
			return _.replaceWithOptions(
				'<div id="modal-video-dialog" class="modal-video">' +
				'	<div class="modal-video-body">' +
				'		<div class="modal-video-inner">' +
				'			<div class="modal-video-movie-wrap"> ' +
				'				<button id="modal-video-dismiss-btn" class="modal-video-close-btn"></button>' +
				'				<iframe src="{URL}" {IFRAMEOPTIONS} frameborder="0" tabindex="-1"></iframe>' +
				'			</div>' +
				'		</div>' +
				'	</div>' +
				'</div>',
				/\{ID\}|\{URL\}|\{IFRAMEOPTIONS\}/g,
				params
			);
		},
		onVideoProgressEvent: function (e) {
			var self = this;

			if (!e.id || !self.videoParams.hasOwnProperty(e.id)) {
				return;
			}

			var params = self.videoParams[e.id];

			if (!_.isTrue(params.ANALYTICS)) {
				return;
			}

			var label = _.getIdGA(e.src, params.ANALYTICS_ID),
				action = e.action;

			console.info('[Video] triggered at ' + action + ' for ' + label);

			setTimeout(function() {
				_.sendGA(label, action);
			});
		}
	};

	var modalVideoPlugin = new ModalVideoPlugin();

	root.addEventListener('message', onMessage, false);

	function onMessage(event) {
		// Check sender origin to be trusted
		if (event.origin.indexOf(root.location.hostname) < 0) {
			return;
		}

		var data = event.data;
		var f = modalVideoPlugin[data.target];

		// use the function that is explicitely declared in this plugin
		if (typeof f === "function") {
			f.call(modalVideoPlugin, data.message);
		}
	}

}(document, window, VideoUtils));

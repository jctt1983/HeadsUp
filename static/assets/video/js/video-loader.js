/**
 * @modal-video-loader
 * Start point of the modal video.
 *
 * Author: Juan Tabares
 */
(function(document, root, undefined) {
	'use strict';

	root.addEventListener('load', onLoad, false);

	function onLoad() {
		var videos = document.querySelectorAll('video[data-video]');
		var modalVideoLinks = document.querySelectorAll('a[data-modal-video]');

		var scripts = new Array(),
			styles = new Array();

		if (!videos.length && !modalVideoLinks.length) {
			return;
		}

		// preload libraries
		if (videos.length) {
			scripts = scripts.concat([
				'//cdnjs.cloudflare.com/ajax/libs/video.js/6.12.1/video.min.js',
				'//cdn.jsdelivr.net/npm/videojs-flash@2.1.1/dist/videojs-flash.min.js',
				'//cdn.jsdelivr.net/npm/videojs-contrib-hls@5.14.1/dist/videojs-contrib-hls.min.js',
				'//cdn.jsdelivr.net/npm/videojs-contrib-quality-levels@2.0.9/dist/videojs-contrib-quality-levels.min.js',
				'//cdn.jsdelivr.net/npm/videojs-hotkeys@0.2.22/videojs.hotkeys.min.js'
			]);

			styles = styles.concat([
				'//cdnjs.cloudflare.com/ajax/libs/video.js/6.12.1/video-js.min.css'
			]);
		}

		var dt = new Date();
		dt.setHours(0, 0, 0, 0);
		var time = dt.getTime();

		// preload custom libraries
		if (videos.length || modalVideoLinks.length) {
			scripts = scripts.concat([
				'/media/video/js/video-utils.js?qt=' + time,
				'/media/video/js/video-wrapper.js?qt=' + time,
			]);

			styles = styles.concat([
				'/media/video/css/modal-video.css?qt=' + time,
			]);
		}

		// load the library for videos
		if (videos.length) {
			scripts = scripts.concat([
				'/media/video/js/video.js?' + time,
			]);
		}

		// load the library for modal videos
		if (modalVideoLinks.length) {
			scripts = scripts.concat([
				'/media/video/js/modal-video.js?qt=' + time,
			]);
		}

		setTimeout(function() {
			console.log('[Video] loading video dependencies...');

			(function (t) {
				var r = document.getElementsByTagName('script');
				var s = r[r.length - 1];
				for (var i = 0; i < t.length; i++) {
					var el = document.createElement('script');
					el.type = 'text/javascript';
					el.async = false;
					el.src = t[i];
					s.parentNode.insertBefore(el, s);
				}
			})(scripts);

			(function(t) {
				var h = document.head;
				for (var i = 0; i < t.length; i++) {
					var el = document.createElement('link');
					el.type = 'text/css';
					el.rel = 'stylesheet';
					el.href = t[i];
					h.appendChild(el);
				}
			})(styles);
		});
	}

}(document, window));

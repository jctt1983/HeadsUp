/**
 * @video
 * provide the modal video function
 *
 * Author: Juan Tabares
 */
(function (document, root, _, undefined) {
    'use strict';

    function VideoPlugin(options) {
        var self = this;

        self.options = _.assign({}, options);
        self.players = {};
        self.videoParams = {};
        self.removeAttributes = [
            'autoplay',
            'controls',
            'preload',
            'src',
        ];

        self.init();
    }

    VideoPlugin.prototype = {
        init: function () {
            var self = this;
            self.scanVideoTags();
        },
        scanVideoTags: function () {
            var self = this;

            var videos = document.querySelectorAll('video[data-video]');

            if (!videos || !videos.length) {
                return;
            }

            self.setupVideos(videos);
        },
        setupVideos: function (videos) {
            var self = this;

            for (var index = 0; index < videos.length; index++) {
                var video = videos[index];

                if (_.isNullOrWhiteSpace(video.getAttribute('data-video'))) {
                    continue;
                }

                var parameters = self.getVideoParams(video);

                self.clearElement(video);
                video.setAttribute('class', 'video-js vjs-default-skin vjs-big-play-centered ' + video.getAttribute('class'));

                self.players[parameters.ID] = new root.VideoWrapper(parameters.ID, parameters);
                self.videoParams[parameters.ID] = parameters;
            }
        },
        getVideoParams: function(element) {
            var self = this;

            var id = element.getAttribute('id'),
				url = element.getAttribute('data-video');

            if (_.isNullOrWhiteSpace(id)) {
                var id = 'video-inline' + _.getHashCode(root.location.pathname + url);
                element.setAttribute('id', id);
            }

            var opt = _.assign({}, {
                ID: id,
                URL: url,
                AUTOPLAY: element.getAttribute('data-video-autoplay') || '0',
                CONTROLS: element.getAttribute('data-video-controls') || '1',
                RESUME: element.getAttribute('data-video-resume') || '1',
                ANALYTICS: element.getAttribute('data-video-analytics') || '1',
                ANALYTICS_ID: element.getAttribute('data-video-analytics-id') || '',
                QUALITY: element.getAttribute('data-video-quality') || 'auto',
                HOTKEYS: element.getAttribute('data-video-hotkeys') || '1',
                WIDTH: element.getAttribute('width') || '100%',
                HEIGHT: element.getAttribute('height') || '100%',
                // Attach events
                onProgressReport: self.onProgressReport.bind(self)
            });

            return opt;
        },
        clearElement: function (element) {
            var self = this;

            for (var index = 0; index < self.removeAttributes.length; index++) {
                element.removeAttribute(self.removeAttributes[index]);
            }
        },
        onProgressReport: function(e) {
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

            setTimeout(function () {
                _.sendGA(label, action);
            });
        }
    };

    var videoPlugin = new VideoPlugin();

}(document, window, VideoUtils));

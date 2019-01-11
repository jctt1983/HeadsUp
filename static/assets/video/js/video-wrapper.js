/**
 * @video
 * provide the modal video function
 *
 * Author: Juan Tabares
 */
(function (document, root, _, undefined) {
    'use strict';

    function VideoWrapper(id, parameters) {
        var self = this;

        self.id = id;
        self.parameters = _.assign({}, parameters);
        self.videoOptions = {
            videoReportProgressNames: {
                0: 'start',
                25: '25%',
                50: '50%',
                75: '75%',
                100: 'finish'
            },
            videoTimeThreshold: 1000 * 60 * 30
        };

        self.init();
        self.checkParameters();
    }

    VideoWrapper.prototype = {
        init: function () {
            var self = this;

            if (_.isNullOrWhiteSpace(self.parameters.URL)) {
                console.warn('[Video] please set the URL in parameters');
                return;
            }

            if (_.isNullOrWhiteSpace(self.id)) {
                console.warn('[Video] please set the id');
                return;
            }

            var sources = self.processUrl(self.parameters.URL);

            var techOptions = _.assign({}, {
                hls: {
                    withCredentials: _.isNAMDomain(
                        self.parameters.URL
                    )
                }
            });

            var srcOptions = {
                width: self.parameters.WIDTH,
                height: self.parameters.HEIGHT,
                controls: self.parameters.CONTROLS,
                autoplay: false,
                preload: false,
                html5: _.assign({}, techOptions),
                flash: _.assign({}, techOptions),
                techOrder: ['html5', 'flash'],
                enableLowInitialPlaylist: true
            };

            self.player = videojs(self.id, srcOptions);

            // setup events
            self.player.on('loadedmetadata', onLoadedMetaDataEvent);
            self.player.on('timeupdate', onTimeUpdateEvent);
            self.player.on('ready', onReadyEvent);

            // init the player with the given source(s)
            self.player.src(sources);

            // cache container
            self.videoStorage = new VideoStorage();

            function onReadyEvent() {
                // enable hotkeys
                if (self.parameters.HOTKEYS) {
                    self.player.hotkeys({
                        alwaysCaptureHotkeys: true
                    });
                }
            }

            function onLoadedMetaDataEvent() {
                self.qualityLevelSelector = new QualityLevelSelector(self.player, {
                    id: self.id,
                    quality: self.parameters.QUALITY
                });

                if (self.parameters.RESUME) {
                    setTimeout(function() {
                        var r = self.videoStorage.getRecord(self.id);
                        var resumeFrom = r.resumeFrom || 0;
                        self.player.currentTime(self.player.duration() == resumeFrom ? 0 : resumeFrom);
                    });
                }

                if (self.parameters.AUTOPLAY) {
                    setTimeout(function() {
                        self.player.play();
                    });
                }
            }

            function onTimeUpdateEvent(evt) {
                if (!self.id || self.player.paused()) {
                    return;
                }

                var record = self.videoStorage.getRecord(self.id);
                record.resumeFrom = parseInt(self.player.currentTime());
                updateVideoProgress.call(self.player, evt, record);
                self.videoStorage.saveRecord(self.id, record);
            }

            function updateVideoProgress(evt, record) {
                var progress = this.ended() ? 100 : Math.floor((this.currentTime() / this.duration()) / 0.25) * 25;
                var action = self.videoOptions.videoReportProgressNames[progress];

                if (!action) {
                    return;
                }

                var now = Date.now();

                if (!record[action] || (now - record[action]) > self.videoOptions.videoTimeThreshold) {
                    // Record the time for this action so we don't send it again until we pass timeThreshold
                    record[action] = now;

                    if (typeof self.parameters.onProgressReport === 'function') {
                        // console.log('[Video] report progress:', action, self.id);
                        self.parameters.onProgressReport({
                            'id': self.id,
                            'action': action,
                            'src': this.currentSrc()
                        });
                    }
                }
            }
        },
        processUrl: function (url) {
            var self = this;

            var urlPartials = url.split('?'),
                baseUrl = urlPartials.shift(),
                urlParameters = (urlPartials.shift() || '').split('&');

            var dt = new Date();

            urlParameters.push('qt=' + [
                dt.getFullYear().toString(),
                (dt.getUTCMonth() + 1).toString(),
                dt.getDate().toString(),
            ].join('-'));

            return {
                type: _.getVideoType(baseUrl),
                src: [
                    baseUrl,
                    urlParameters.join('&')
                ].join('?')
            };
        },
        checkParameters: function() {
            var self = this;

            var fields = [
                'AUTOPLAY',
                'CONTROLS',
                'RESUME',
                'ANALYTICS',
                'HOTKEYS',
            ];

            for (var index = 0; index < fields.length; index++) {
                var field = fields[index];
                self.parameters[field] = _.isTrue(self.parameters[field]);
            }
        }
    };

    function QualityLevelSelector(player, options) {
        var self = this;

        self.options = _.assign({
            quality: 'auto'
        }, options);

        self.player = player;
        self.init();
    }

    QualityLevelSelector.prototype = {
        init: function () {
            var self = this;

            if (_.isNullOrWhiteSpace(self.options.id)) {
                console.warn('[Video] please the id to setup the quality selectors.')
            }

            self.setupQualityLevels();
        },
        setupQualityLevels: function () {
            var self = this;

            var qualityLevels = self.player.qualityLevels() || [];

            if (!qualityLevels.length) {
                return;
            }

            var addedQualityLevels = [];

            for (var index = 0; index < qualityLevels.length; index++) {
                var qualityLevel = qualityLevels[index];

                // do not add the same quality level more than once
                if (addedQualityLevels.indexOf(qualityLevel.height) > -1) {
                    continue;
                }

                addedQualityLevels.push(qualityLevel.height);
            }

            addedQualityLevels.sort().reverse();

            var fullScreenControlEl = document.querySelectorAll('#' + self.options.id + ' .vjs-fullscreen-control')[0];
            _.insertBefore(fullScreenControlEl, self.getQualityContainerHTML());

            var qualityList = document.querySelectorAll('#' + self.options.id + ' .quality_ul')[0];
            var selectedQuality = (self.options.quality || 'auto').toLowerCase();

            // find quality level
            var selectedIndex = 0;

            if (selectedQuality.indexOf('a') === 0) {
                selectedIndex = Math.round(addedQualityLevels.length / 2) - 1;
            } else if (selectedQuality.indexOf('l') === 0) {
                selectedIndex = addedQualityLevels.length - 1;
            } else if (selectedQuality.indexOf('h') === 0) {
                // nothing to do
            }

            var selectedQualityLevel = addedQualityLevels[selectedIndex];

            // add the quality levels selectors
            for (index = 0; index < addedQualityLevels.length; index++) {
                var qualityLevel = addedQualityLevels[index];

                // add quality to selector
                var t = self.getQualityItemHTML()
                    .replace(/\{\{\$i\}\}/gi, index)
                    .replace(/\{\{\$val\}\}/gi, qualityLevel);


                if (qualityLevel === selectedQualityLevel) {
                    t = t.replace('class="vjs-menu-item"', 'class="vjs-menu-item vjs-selected"');
                }

                _.appendToElement(qualityList, t);

                // add on click event
                var btn = document.querySelectorAll('#' + self.options.id + ' #vjs-menu-item-' + index)[0];
                btn.addEventListener('click', self.onSelectedQualityLevel.bind(self, btn));
            }

            self.setQualityLevels(selectedQualityLevel, false);
        },
        setQualityLevels: function (selectedQualityLevel, playPause) {
            var self = this;

            if (!selectedQualityLevel) {
                return;
            }

            if (playPause) {
                self.player.pause();
            }

            var qualityLevels = self.player.qualityLevels() || {length:0};
            var selectedIndex = -1;

            // disable enable quality levels
            for (var index = 0; index < qualityLevels.length; index++) {
                var qualityLevel = qualityLevels[index];

                if (!qualityLevel.height) {
                    continue;
                }

                qualityLevel.enabled = !!(qualityLevel.height === selectedQualityLevel);

                if (qualityLevel.enabled) {
                    selectedIndex = index;
                }
            }

            if (playPause) {
                if (selectedIndex !== -1) {
                    qualityLevels.selectedIndex_ = selectedIndex;
                    qualityLevels.trigger({ type: 'change', selectedIndex: selectedIndex });
                }

                setTimeout(function () {
                    self.player.play();
                }, 1000);
            }
        },
        getQualityContainerHTML: function() {
            return '' +
            '<div class="quality_setting vjs-menu-button vjs-menu-button-popup vjs-control vjs-button">' +
            '    <button class="vjs-menu-button vjs-menu-button-popup vjs-button" type="button" aria-live="polite" aria-disabled="false" title="Quality" aria-haspopup="true" aria-expanded="false">' +
            '    <span aria-hidden="true" class="vjs-icon-cog"></span>' +
            '    <span class="vjs-control-text">Quality</span></button>' +
            '    <div class="vjs-menu">' +
            '        <ul class="quality_ul vjs-menu-content" role="menu"></ul>' +
            '    </div>' +
            '</div>';
        },
        getQualityItemHTML: function() {
            return '' +
            '<li id="vjs-menu-item-{{$i}}" class="vjs-menu-item" tabindex="{{$i}}" role="menuitemcheckbox" aria-live="polite" aria-disabled="false" aria-checked="false" bitrate="{{$val}}">' +
            '    <span class="vjs-menu-item-text">{{$val}}p</span>' +
            '</li>';
        },
        onSelectedQualityLevel: function (btn, e) {
            !!e && !!e.preventDefault && e.preventDefault();

            var self = this;
            var id = self.player.getAttribute('id');
            var qualityLevels = self.player.qualityLevels();

            // remove attributes from current selected element
            var items = document.querySelectorAll('[id^=' + id + '] .quality_ul li.vjs-selected');

            for (var index = 0; index < items.length; index++) {
                const item = items[index];
                _.removeClass(item, 'vjs-selected');
                item.setAttribute('aria-checked', 'false');
            }

            _.addClass(btn, 'vjs-selected');
            btn.setAttribute('aria-checked', 'true');

            var selectedQualityLevel = parseInt(btn.getAttribute('bitrate'));

            setTimeout(self.setQualityLevels.bind(self, selectedQualityLevel, true));

            console.log('[Video] quality level changed', selectedQualityLevel);
        }
    }

    function VideoStorage() {
        var self = this;

        var videoStorageName = _.getHashCode(root.location.hostname),
            videoStorageContainer = _.getLocalStorage(videoStorageName);

        self.getRecord = function (key) {
            return videoStorageContainer[key] || {};
        }

        self.saveRecord = function (key, record) {
            videoStorageContainer[key] = record || {};
            _.setLocalStorage(videoStorageName, videoStorageContainer);
        }
    }

    root['VideoWrapper'] = VideoWrapper;
}(document, window, VideoUtils));
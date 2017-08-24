'use strict';

module.exports = {
	frontend: {
		src: [
			'<%= pkg.app.templates %>/main/staging/base.html',
			'<%= pkg.app.templates %>/main/staging/home.html'
		],
		options: {
			dest: './',
			flow: {
				html: {
					steps: {
						js: ['concat', 'uglify'],
						css: ['concat', 'cssmin']
					},
					post: {}
				}
			},
			staging: '<%= pkg.app.tmp %>/usemin'
		}
	},
	backend: {
		src: '<%= pkg.app.templates %>/admin/staging/base.html',
		options: {
			dest: './',
			flow: {
				html: {
					steps: {
						js: ['concat', 'uglify'],
						css: ['concat', 'cssmin']
					},
					post: {}
				}
			},
			staging: '<%= pkg.app.tmp %>/usemin'
		}
	}
}

'use strict';

import { AppConfig } from 'Assets/main/scripts/appConfig';
import { SpinnerHelper } from 'Assets/helpers';
import { PictureApiService } from 'Assets/main/scripts/api';
import { UtilHelper } from 'Assets/helpers';
import alertify from 'Lib/alertifyjs/build/alertify.js';

export class CoverPicturePlugin {

	constructor(options) {
		this._options = Object.assign({
			picture: 0,
			post_id: 0,
			imageHeight: 250,
			imageWidth: 750,
			maxFileSizeInMb: 5,
			coverPictureSelector: '.cover-picture',
			inputFileSelector: 'cover-picture-upload',
			updatePictureSelector: '.cover-picture-panel span.update, .cover-picture-button',
			removeButtonSelector: '.cover-picture-panel span.delete',
		}, options || {});
		this._init();
	}

	_init() {
		this._coverPicture = document.querySelector(this._options.coverPictureSelector);

		if (!this._coverPicture) {
			return;
		}

		this._pictureApiHelper = new PictureApiService(AppConfig.pictureApiUrl);

		this._coverPictureWrapper = document.querySelector('.cover-picture-wrapper');
		this._coverPictureResultBtn = document.getElementById('cover-picture-result');
		this._coverPictureCancelBtn = document.getElementById('cover-picture-cancel');
		this._coverPictureRotateLeftBtn = document.querySelector('.cover-picture-rotate-left');
		this._coverPictureRotateRightBtn = document.querySelector('.cover-picture-rotate-right');

		this._fileReader = new FileReader();
		this._inputFile = document.getElementById(this._options.inputFileSelector);
		this._uploadBtn = document.querySelectorAll(this._options.updatePictureSelector);
		this._removeBtn = document.querySelector(this._options.removeButtonSelector);
		this._spinnerHelper = new SpinnerHelper();
		this._picture = this._options.picture;

		this._setupListeners();
		this._updateCoverPicture(this._picture ? 'show' : 'upload');
	}

	_getCropper(isNew) {
		if (isNew && this._coverPictureCropper) {
			this._coverPictureCropper.destroy();
			this._coverPictureCropper = null;
		}

		if (!this._coverPictureCropper) {
			let containerDiv = document.querySelector('.cover-picture-cropper');
			let cropperWidth = containerDiv.getBoundingClientRect().width;

			this._coverPictureCropper = new Croppie(containerDiv, {
				enableExif: true,
				type: 'canvas',
				viewport: { width: this._options.imageWidth, height: this._options.imageHeight, type: 'square' },
				boundary: { width: cropperWidth, height: this._options.imageHeight },
				showZoomer: true,
				enableOrientation: true,
				quality: 1
			});
			this._rotateValue = 0;
		}

		return this._coverPictureCropper;
	}

	_setupListeners() {
		this._lastFile = null;

		this._fileReader.addEventListener('load', (e) => {
			// monitor changes on the file reader
			this._updateCoverPicture('edit');

			let coverPictureCropper = this._getCropper(true);

			coverPictureCropper
				.bind({
					url: e.target.result
				})
				.then(() => {
					// clear input file
					this._inputFile.value = null;
				});
		}, false);

		this._coverPictureResultBtn.addEventListener('click', (evt) => {
			evt.preventDefault();
			let options = {
				type: 'base64',
				size: {'width': this._options.imageWidth * 2, 'height': this._options.imageHeight * 2},
				format: 'jpeg',
				circle: false
			};

			let coverPictureCropper = this._getCropper();

			coverPictureCropper.result(options)
				.then(data => {
					this._updateStatus(false);
					let image = {
						data: data,
						name: this._fileReader.file.name
					};

					this._upload(image)
						.then(response => {
							this._updateStatus(true);
							this._picture = response.picture;
							this._updateCoverPicture('show');
						})
						.catch(() => {
							this._updateStatus(true);
						});
				})
		});

		this._coverPictureCancelBtn.addEventListener('click', (evt) => {
			evt.preventDefault();
			this._updateCoverPicture(this._picture ? 'show' : 'upload');
		});

		let onRotatePictureToLeft = UtilHelper.debounce(() => {
			let coverPictureCropper = this._getCropper();
			this._rotateValue += 90;
			if (this._rotateValue === -360 || this._rotateValue === 360) {
				this._rotateValue = 0;
			}
			coverPictureCropper.rotate(this._rotateValue);
			console.log(this._rotateValue);
		}, 250);

		let onRotatePictureToRight= UtilHelper.debounce(() => {
			let coverPictureCropper = this._getCropper();
			this._rotateValue -= 90;
			if (this._rotateValue === -360 || this._rotateValue === 360) {
				this._rotateValue = 0;
			}
			coverPictureCropper.rotate(this._rotateValue);
			console.log(this._rotateValue);
		}, 250);

		this._coverPictureRotateLeftBtn.addEventListener('click', (evt) => {
			evt.preventDefault();
			onRotatePictureToLeft();
		});

		this._coverPictureRotateRightBtn.addEventListener('click', (evt) => {
			evt.preventDefault();
			onRotatePictureToRight();
		});

		// monitor changes on the input file
		this._inputFile.addEventListener('change', () => {
			let file = this._inputFile.files[0];
			const maxFileSizeInMb = this._options.maxFileSizeInMb;

			let fileSize = file.size / 1024 / 1024;
			if (fileSize > maxFileSizeInMb) {
				alertify.notify(`File size exceeds ${maxFileSizeInMb} MB`, 'error');
				return;
			}

			this._fileReader.file = file;
			this._fileReader.readAsDataURL(file);
		});

		// trigger the input file to search for a picture
		this._uploadBtn.forEach((btn) => {
			btn.addEventListener('click', (evt) => {
				evt.preventDefault();
				this._inputFile.click();
			});
		});

		// remove picture
		this._removeBtn.addEventListener('click', (evt) => {
			evt.preventDefault();

			this._updateStatus(false);
			this._remove()
				.then(() => {
					this._updateStatus(true);
					this._picture = null;
					this._updateCoverPicture('upload');
				})
				.catch(() => {
					this._updateStatus(true);
				});
		});

		['dragenter', 'dragover'].forEach(eventName => {
			this._coverPicture.addEventListener(eventName, (e) => {
				e.preventDefault();
				e.stopPropagation();
				this._coverPicture.classList.add('highlight');
			}, false);
		});

		['dragleave', 'drop'].forEach(eventName => {
			this._coverPicture.addEventListener(eventName, (e) => {
				e.preventDefault();
				e.stopPropagation();
				this._coverPicture.classList.remove('highlight');
			}, false);
		});

		this._coverPicture.addEventListener('drop', (e) => {
			if (this._coverPicture.classList.contains('has-picture')) {
				// ignore in this sitation
				return;
			}

			let dt = e.dataTransfer;
			let file = dt.files[0];
			this._fileReader.file = file;
			this._fileReader.readAsDataURL(file);
		}, false);
	}

	_updateCoverPicture(mode) {
		const picture = this._picture;
		this._coverPicture.style.backgroundImage = '';
		this._coverPictureWrapper.classList.remove('edit-picture');
		this._coverPictureWrapper.classList.remove('show-picture');
		this._coverPictureWrapper.classList.remove('upload-picture');

		if (mode === 'edit') {
			this._coverPictureWrapper.classList.add('edit-picture');
		}

		if (mode === 'show') {
			this._coverPictureWrapper.classList.add('show-picture');
			this._coverPicture.style.backgroundImage = `url(${picture.image_url})`;
		}

		if (mode === 'upload') {
			this._coverPictureWrapper.classList.add('upload-picture');
		}
	}

	_upload(image) {
		const data = {
			'image': image,
			'post_id': this._options.post_id,
		};

		// Starts the upload process.
		return this._pictureApiHelper.uploadImageData(data);
	}

	_remove() {
		if (!this._picture) {
			return;
		}

		const id = this._picture.id;

		return this._pictureApiHelper.delete(id);
	}

	_updateStatus(enabled) {
		if (!!enabled) {
			this._spinnerHelper.stop();
		} else {
			this._spinnerHelper.start();
		}
	}
}


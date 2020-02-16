# -*- coding: utf8 -*-

from PIL import Image
from io import BytesIO
import hashlib
import datetime
import config
import os
import shutil
import base64


def save_image_withour_exif(f, path):
    image = Image.open(f)

    # next 3 lines strip exif
    data = list(image.getdata())
    image_without_exif = Image.new(image.mode, image.size)
    image_without_exif.putdata(data)
    image_without_exif.save(path)


def resize_pict(infile, outfile, size):
    im = Image.open(infile)
    im.thumbnail((size, size), Image.ANTIALIAS)
    im.save(outfile)


def get_file_info(f):
    base = os.path.basename(f.filename.lower())
    n, e = os.path.splitext(base)

    return (n, e.replace('.', ''))


def get_file_hash(f):
    h = hashlib.new('md5')
    h.update(f.filename)
    h.update(datetime.datetime.utcnow().isoformat())

    return h.hexdigest()


def get_image_data(image):
    image_name = image.get('name', 'noname.jpg').lower()
    image_base64 = image.get('data', None)

    pos = image_base64.find(',')

    image_raw = image_base64[pos+1:]
    image_info = image_base64[:pos].lower()
    extension = 'png'

    if image_name:
        parts = image_name.split('.')
        parts.pop()
        image_name = u'.'.join(parts)

    if 'image/jpeg' in image_info:
        extension = 'jpeg'
    elif 'image/jpg' in image_info:
        extension = 'jpg'

    return (image_name, extension, image_raw)


def save_image_data(path, image_data):
    image = Image.open(BytesIO(base64.b64decode(image_data)))
    image.save(path)
    return image

def save_image_data_without_exif(path, image):
    data = list(image.getdata())
    image_without_exif = Image.new(image.mode, image.size)
    image_without_exif.putdata(data)
    image_without_exif.save(path)


def get_image_hash(image_raw):
    h = hashlib.new('md5')
    h.update(image_raw)
    h.update(datetime.datetime.utcnow().isoformat())
    return h.hexdigest()


def clean_folder(mydir):
    try:
        shutil.rmtree(mydir)
    except OSError as e:
        app.logger.info(
            u'[PictureHelper] Unable to clean folder: %s - %s.' % (e.filename, e.strerror))

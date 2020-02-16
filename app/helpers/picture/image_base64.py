
import hashlib
import datetime
import config
import os
import shutil

from app import app

from helper import save_image_data_without_exif, resize_pict, get_image_data, get_image_hash, save_image_data, clean_folder



def process_image_base64(picture, image):
    """Process the given image and attempt to save in different sizes."""
    from app.models import Picture
    base_dir = None

    try:
        filename, extension, image_data = get_image_data(image)

        app.logger.info(u'[PictureHelper] filename %s, extension %s' % (filename, extension))

        img_uuid = get_image_hash(image_data)
        base_dir = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, img_uuid)

        if not os.path.exists(base_dir):
            os.mkdir(base_dir)
            app.logger.info(u'folder created %s' % base_dir)

        picture.extension = extension

        # save the original file
        picture.name_org = u'%s/%s_org.%s' % (img_uuid, filename, extension)
        path = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, picture.name_org)
        f = save_image_data(path, image_data)
        app.logger.info(u'[PictureHelper] original image saved at %s' % path)

        # save image without EXIF info
        picture.name = u'%s/%s.%s' % (img_uuid, filename, extension)
        path = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, picture.name)
        save_image_data_without_exif(path, f)
        app.logger.info(u'[PictureHelper] picture saved without EXIF at %s' % path)

        infile = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, picture.name)

        sizes = [
            ('sd', Picture.SIZE_SD),
            ('md', Picture.SIZE_MD),
            ('sm', Picture.SIZE_SM)
        ]

        for label, size in sizes:
            prop_name = 'name_%s' % label
            prop_value = u'%s/%s_%s.%s' % (img_uuid, filename, label, extension)
            picture.set_attribute(prop_name, prop_value)

            outfile = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, prop_value)
            resize_pict(infile, outfile, size)

            app.logger.info(u'[PictureHelper] p(%s, %s) = %s' % (label, size, outfile))

    except Exception as e:
        import sys, traceback
        traceback.print_exc(file=sys.stdout)

        app.logger.error(u'[PictureHelper] error, %s' % e.message)
        if base_dir:
            clean_folder(base_dir)
        raise e

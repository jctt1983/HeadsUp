
from app import app
import config
import os
from helper import save_image_withour_exif, resize_pict, get_file_info, get_file_hash, clean_folder


def process_image_file(picture, f):
    """Process the given image and attempt to save in different sizes."""
    from app.models import Picture
    filename, extension = get_file_info(f)
    img_uuid = get_file_hash(f)
    base_dir = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, img_uuid)

    try:
        if not os.path.exists(base_dir):
            os.mkdir(base_dir)
            app.logger.info(u'folder created %s' % base_dir)

        picture.extension = extension

        # save the original file
        picture.name_org = u'%s/%s_org.%s' % (img_uuid, filename, extension)
        path = os.path.join(onfig.UPLOAD_MEDIA_PICTURES_PATH, picture.name_org)
        f.save(path)

        app.logger.info(u'[PictureHelper] original image saved at %s' % path)

        # save image without EXIF info
        picture.name = u'%s/%s.%s' % (img_uuid, filename, extension)
        path = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, picture.name)
        save_image_withour_exif(f, path)
        app.logger.info(u'[PictureHelper] picture saved without EXIF at %s' % path)

        infile = os.path.join(config.UPLOAD_MEDIA_PICTURES_PATH, picture.name)

        sizes = [
            ('sd', Picture.SIZE_SD),
            ('md', Picture.SIZE_MD),
            ('sm', Picture.SIZE_SM)
        ]

        for label, size in sizes:
            prop_name = 'name_%s' % label
            prop_value = u'%s/%s_%s.%s' % (img_uuid,
                                           filename, label, extension)
            picture.set_attribute(prop_name, prop_value)

            outfile = os.path.join(
                config.UPLOAD_MEDIA_PICTURES_PATH, prop_value)
            resize_pict(infile, outfile, size)

            app.logger.info(u'[PictureHelper] p(%s, %s) = %s' %
                            (label, size, outfile))

    except Exception as e:
        app.logger.error(u'[PictureHelper] error, %s' % e.message)
        clean_folder(base_dir)
        raise e

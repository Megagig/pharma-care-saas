import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (
   file: string,
   folder: string = 'pharma-care'
) => {
   try {
      const result = await cloudinary.uploader.upload(file, {
         folder,
         transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' },
         ],
      });
      return result;
   } catch (error) {
      throw new Error('Image upload failed');
   }
};

export { cloudinary };

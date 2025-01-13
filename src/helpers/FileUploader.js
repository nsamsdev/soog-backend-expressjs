import { v2 as cloudinary } from 'cloudinary';


export default class FileUploader {

  constructor() {
    this.cloudinary = cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET // Click 'View API Keys' above to copy your API secret
    });
  }
}



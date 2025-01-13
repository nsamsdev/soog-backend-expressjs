import { v2 as cloudinary } from 'cloudinary';

export default class CloudinaryUpload {

  constructor(name, apiKey, secret) {
    this.cloudinary = cloudinary.config({
      cloud_name: name,
      api_key: apiKey,
      api_secret: secret,
    });
  }

  async getSignture(fileData) {

  }
}

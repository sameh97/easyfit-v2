import { inject, injectable } from "inversify";
import { Logger } from "../common/logger";
import * as AWS from "aws-sdk";
import * as fs from "fs";
import { ObjectCannedACL } from "aws-sdk/clients/s3";

require("dotenv").config();

@injectable()
export class FileUploadService {
  public s3: AWS.S3;

  constructor(@inject(Logger) private logger: Logger) {
    this.s3 = new AWS.S3({
      region: process.env.AWS_BUCKET_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });
  }

  public upload = async (file: any): Promise<any> => {
    const fileStream = fs.createReadStream(file.path);
    const acl: ObjectCannedACL = "public-read";

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Body: fileStream,
      Key: file.filename,
      ACL: acl
    };

    return this.s3.upload(uploadParams).promise();
  };

  // public deleteFromS3(file: any) {
  //   return this.s3
  //     .deleteObject({
  //       Bucket: process.env.AWS_BUCKET_NAME,
  //       Key: file,
  //     })
  //     .promise();
  // }

  // public delete = async (fileKey: string): Promise<any> => {
  //   var params = { Bucket: process.env.AWS_BUCKET_NAME, Key: fileKey };

  //   return this.s3.deleteObject(params).promise();
  // };

  public getFileStream = async (fileKey: any): Promise<any> => {
    const downloadParams = {
      Key: fileKey,
      Bucket: process.env.AWS_BUCKET_NAME,
    };

    return this.s3.getObject(downloadParams).createReadStream();
  };
}

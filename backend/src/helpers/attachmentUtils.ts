import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStorage logic
export class AttachmentUtils {
    constructor(
        private readonly s3 =  new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucket = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) {}

    generateUploadUrl(todoId: string): string {
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucket,
            Key: todoId,
            Expires: this.urlExpiration
        })
    }
}
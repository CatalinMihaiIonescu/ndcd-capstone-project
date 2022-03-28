import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { UserProfile } from '../models/UserProfile'

const logger = createLogger('profileAccess')

const XAWS = AWSXRay.captureAWS(AWS)

export class UserProfileAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly usersTable = process.env.USER_PROFILE_TABLE,
        private readonly sns = new AWS.SNS({ apiVersion: '2010-03-31' }),
        private readonly snsArn = process.env.SNS_ARN
    ) {}

    async getUserProfile(userId: String): Promise<UserProfile> {
        logger.info(`Fetching user profile of user ${userId}.`)

        const result = await this.docClient.get({
            TableName: this.usersTable,
            Key: {
                userId
            }
        }).promise()

        return result.Item as UserProfile
    }

    async setUserProfile(userProfile: UserProfile): Promise<UserProfile> {
        logger.info(`setting profile for ${userProfile.userId}`)

        const oldSubs = await this.getUserProfile(userProfile.userId)

        if (oldSubs) {
            logger.info(`removing old subscription of ${userProfile.userId}!`)

            await this.unsubscribeFromSns(userProfile.userId)
        }

        const resultSubs = await this.subscribeToSns(userProfile.userId, userProfile.email)

        logger.info(resultSubs.SubscriptionArn)

        await this.docClient.update({
            TableName: this.usersTable,
            Key: {
                "userId": userProfile.userId
            },
            UpdateExpression: "set email = :email, subscribtionId = :arn",
            ExpressionAttributeValues: {
                ":email": userProfile.email,
                ":arn"  : resultSubs.SubscriptionArn
            },
        }).promise()

        return userProfile
    }

    async deleteUserProfile(userId: string) {
        logger.info(`deleting profile for user ${userId}`)

        await this.unsubscribeFromSns(userId)

        await this.docClient.delete({
            TableName: this.usersTable,
            Key: {
                "userId": userId
            }
        }).promise()
    }

    async subscribeToSns(userId: string, email: string) {
        logger.info(`subscribing ${email} to ${this.snsArn}`)

        const params = {
            Protocol: 'email', /* required */
            TopicArn: this.snsArn, /* required */
            Endpoint: email,
            ReturnSubscriptionArn: true,
            Attributes: {
                'FilterPolicy' : JSON.stringify( {"target": [ userId ]} )
            }
          }

        return await this.sns.subscribe(params).promise();      
    }

    async unsubscribeFromSns(userId: string) {
        const profile = await this.getUserProfile(userId)

        logger.info(`unsubscribe ${profile.email} with id ${profile.subscribtionId} from sns`)

        await this.sns.unsubscribe({ SubscriptionArn: profile.subscribtionId }).promise()
    }

    async sendEmailNotification(userId: string, message: string) {
        logger.info(`sending notification to ${userId}`)

        await this.sns.publish({
            TopicArn: this.snsArn,
            Message: message,
            MessageAttributes: {
                target: {
                    DataType: "String",
                    StringValue: userId
                }
            }
        }).promise()
    }

}
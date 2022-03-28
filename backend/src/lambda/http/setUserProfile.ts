import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { SetUserProfileRequest } from '../../requests/SetUserProfileRequest'
import { getUserId } from '../utils';
import { setUserProfile } from '../../helpers/profile'
import { createLogger } from '../../utils/logger'

const logger = createLogger('setUserProfile')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newProfile: SetUserProfileRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    const userId = getUserId(event)

    logger.info(`setting new profile for user ${userId}`)

    const item = await setUserProfile(userId, newProfile)
    
    return {
      statusCode: 201,
      body: JSON.stringify({ item })
    }
})

handler.use(
  cors({
    credentials: true
  })
)

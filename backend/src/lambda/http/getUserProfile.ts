import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getUserProfile } from '../../helpers/profile'
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger'

const logger = createLogger('getUserProfile')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    const userId = getUserId(event)

    logger.info(`Getting profile for ${userId}`)

    const profile = await getUserProfile(userId)

    return {
      statusCode: 200,
      body: JSON.stringify({ profile })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)

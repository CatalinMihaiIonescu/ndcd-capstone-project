import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteUserProfile } from '../../helpers/profile'
import { getUserId } from '../utils'

import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteUserProfile')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = getUserId(event)

    logger.info(`deleting profile for user ${userId}`)

    await deleteUserProfile(userId)
    
    return {
      statusCode: 204,
      body: ``
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )

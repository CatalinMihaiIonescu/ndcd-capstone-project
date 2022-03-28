import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../helpers/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    const userId = getUserId(event)

    logger.info(`creating new todo for user ${userId}`)

    const item = await createTodo(userId, newTodo)

    logger.info(`successfuly created todo ${item.todoId} for user ${userId}`)
    
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

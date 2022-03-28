import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {

        }

        async getTodos(userId: String): Promise<TodoItem[]> {
            logger.info(`Fetching all todos for ${userId}`)

            const result = await this.docClient.query({
                TableName: this.todosTable,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            }).promise()

            const items = result.Items
            return items as TodoItem[] 
        }

        async createTodo(todo: TodoItem): Promise<TodoItem> {
            logger.info(`Creating todo with id ${todo.todoId}`)
            await this.docClient.put({
                TableName: this.todosTable,
                Item: todo
            }).promise()

            return todo
        }

        async updateTodo(userId: string, todoId:string, updatedTodo: TodoUpdate): Promise<TodoUpdate> {
            logger.info(`updating ${todoId} for user ${userId}`)

            await this.docClient.update({
                TableName: this.todosTable,
                Key: {
                    "userId": userId,
                    "todoId": todoId
                },
                UpdateExpression: "set #n = :name, dueDate = :dueDate, done = :done",
                ExpressionAttributeValues: {
                    ":name": updatedTodo.name,
                    ":dueDate": updatedTodo.dueDate,
                    ":done": updatedTodo.done
                },
                ExpressionAttributeNames: {
                    "#n": "name"
                }
            }).promise()

            return updatedTodo
        }

        async deleteTodo(userId: string, todoId: string) {
            logger.info(`deleting ${todoId} for user ${userId}`)

            await this.docClient.delete({
                TableName: this.todosTable,
                Key: {
                    "userId": userId,
                    "todoId": todoId
                }
            }).promise()
        }
}
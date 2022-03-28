import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import {UserProfileAccess} from './profileAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'


// TODO: Implement businessLogic

const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()
const userProfileAccess = new UserProfileAccess()
const bucket = process.env.ATTACHMENT_S3_BUCKET
const logger = createLogger('todos')

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info(`getting all todos of user ${userId}`)

    return await todosAccess.getTodos(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4()

    logger.info(`Creating todo ${todoId} for user ${userId}`)

    const newTodo: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: `https://${bucket}.s3.eu-central-1.amazonaws.com/${todoId}`
    }
    
    await todosAccess.createTodo(newTodo)

    const profile = await userProfileAccess.getUserProfile(userId)

    if (profile) {
        userProfileAccess.sendEmailNotification(userId, `Todo ${todoId} with due date ${newTodo.dueDate} has been created!`)
    }

    return newTodo
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
    logger.info(`updating ${todoId} for user ${userId}`)

    todosAccess.updateTodo(userId, todoId, updateTodoRequest)
}

export async function deleteTodo(userId: string, todoId: string) {
    logger.info(`deleting ${todoId} for user ${userId}`)

    todosAccess.deleteTodo(userId, todoId)
}

export async function generateUploadUrl(userId: string, todoId: string): Promise<string> {
    const userItems = await todosAccess.getTodos(userId)

    const item = userItems.find(function (item) {
        return item.todoId === todoId
    })

    logger.info(`User ${userId} can upload to ${todoId}`)

    if ( !item ) {
        throw new Error (`Item ${todoId} does not exist for user ${userId}`)
    }

    return attachmentUtils.generateUploadUrl(todoId)
}
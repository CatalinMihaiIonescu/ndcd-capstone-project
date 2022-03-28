import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo, setUserProfile, deleteUserProfile, getUserProfile } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
import { UserProfile } from '../types/UserProfile'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  userProfile: UserProfile, 
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  email: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    userProfile: {userId:"", email:""},
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    email: ''
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ email: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onUserProfileSet = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const userProfile = await setUserProfile(this.props.auth.getIdToken(), {
        email: this.state.email,
      })
      this.setState({
        userProfile,
        email: ''
      })
    } catch {
      alert('Couldn\'t set user profile')
    }
  }

  onUserProfileDelete = async () => {
    try {
      await deleteUserProfile(this.props.auth.getIdToken())
      this.setState({
        userProfile: {email: ''}
      })
    } catch {
      alert('User Profile deletion failed')
    }
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const userProfile = await getUserProfile(this.props.auth.getIdToken())
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        userProfile,
        todos,
        loadingTodos: false
      })
    } catch (e) {
      let errorMessage = "Failed to do something exceptional";
      
      if (e instanceof Error) {
        errorMessage = e.message;
      }

      alert(`Failed to fetch todos: ${errorMessage}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">User Profile</Header>

        {this.renderUserProfile()}

        {this.renderUserProfileInput()}

        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderUserProfile() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return (
      <Grid.Row>
        <Grid.Column width={15}>
          {(this.state.userProfile?.email || '')}
        </Grid.Column>
        <Grid.Column width={1}>
          <Button
            icon
            color="red"
            onClick={() => this.onUserProfileDelete()}
            >
            <Icon name="delete" />
          </Button>
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderUserProfileInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'Set Profile',
              onClick: this.onUserProfileSet
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleEmailChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}

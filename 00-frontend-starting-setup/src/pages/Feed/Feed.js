import React, { Component, Fragment } from 'react'

import Post from '../../components/Feed/Post/Post'
import Button from '../../components/Button/Button'
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit'
import Input from '../../components/Form/Input/Input'
import Paginator from '../../components/Paginator/Paginator'
import Loader from '../../components/Loader/Loader'
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler'
import './Feed.css'

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
  }

  componentDidMount() {
    fetch('http://localhost:8080/graphql', {
      method: "POST",
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({query: `{
        getStatus(userId: "${this.props.userId}")
      }`})
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch user status.')
        }
        return res.json()
      })
      .then(resData => {
        this.setState({ status: resData.data.getStatus })
      })
      .catch(this.catchError)

    this.loadPosts()
  }

  deletePost = post => {
    this.setState(prevState => {
      const updatedPosts = prevState.posts.filter(el => el._id !== post._id)
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts - 1,
      }
    })
  }

  editPost = post => {
    this.setState(prevState => {
      const updatedPosts = prevState.posts.map(el => {
        if (el._id === post._id) {
          return post
        }
        return el
      })

      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts,
      }
    })
  }

  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts]
      if (prevState.postPage === 1) {
        if (prevState.posts.length >= 2) {
          updatedPosts.pop()
        }
        updatedPosts.unshift(post)
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1,
      }
    })
  }

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] })
    }
    let page = this.state.postPage
    if (direction === 'next') {
      page++
      this.setState({ postPage: page })
    }
    if (direction === 'previous') {
      page--
      this.setState({ postPage: page })
    }

    const graphqlQuery = {
      query: `{
        getPosts(page:${page}) {
          posts {
            _id
            title
            content
            imageUrl
            createdAt
            creator {
              name
              _id
            }
          }
          totalPosts
        }
      }`,
    }

    fetch('http://localhost:8080/graphql', {
      body: JSON.stringify(graphqlQuery),
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error('Failed to fetch posts.')
        }
        return res.json()
      })
      .then(resData => {
        const { posts, totalPosts } = resData.data.getPosts

        this.setState({
          posts: posts.map(post => ({
            ...post,
            imagePath: post.imageUrl,
          })),
          totalPosts,
          postsLoading: false,
        })
      })
      .catch(this.catchError)
  }

  statusUpdateHandler = event => {
    event.preventDefault()
    const { status } = this.state
    fetch('http://localhost:8080/status/' + this.props.userId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.props.token,
      },
      body: JSON.stringify({
        status,
      }),
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't update status!")
        }
        return res.json()
      })
      .then(resData => {
        console.log(resData)
      })
      .catch(this.catchError)
  }

  newPostHandler = () => {
    this.setState({ isEditing: true })
  }

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) }

      return {
        isEditing: true,
        editPost: loadedPost,
      }
    })
  }

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null })
  }

  finishEditHandler = async postData => {
    try {
      this.setState({
        editLoading: true,
      })
      const { title: inputTitle, content: inputContent } = postData
      let filename
      const formData = new FormData()

      formData.append('image', postData.image)

      if (this.state.editPost) {
        formData.append('oldPath', this.state.editPost.imagePath)
        filename = this.state.editPost.imagePath
      }

      //uploading and updating image
      if (typeof postData.image !== 'string') {
        const imageUploadRes = await fetch('http://localhost:8080/post-image', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + this.props.token,
          },
          body: formData,
        })
        const imageUploadResData = await imageUploadRes.json()
        filename = imageUploadResData.filename
        if (!imageUploadRes.ok) {
          throw new Error(imageUploadResData.message)
        }
      }

      let mutation, idArg

      if (this.state.editPost) {
        mutation = 'updatePost'
        idArg = '_id: "' + this.state.editPost._id + '", '
      } else {
        mutation = 'createPost'
        idArg = ''
      }

      const graphqlQuery = {
        query: `
        mutation {
          ${mutation}(postInput: {${idArg}title: "${inputTitle}", content: "${inputContent}", imageUrl: "${filename}"}) {
            _id
            title
            content
            imageUrl
            creator {
              name
              _id
            }
            createdAt
          }
        }
      `,
      }

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        body: JSON.stringify(graphqlQuery),
        headers: {
          Authorization: 'Bearer ' + this.props.token,
          'Content-Type': 'application/json',
        },
      })
      const resData = await res.json()
      const { _id, title, content, creator, createdAt, imageUrl } = resData.data[mutation]

      const post = {
        _id,
        title,
        content,
        creator,
        createdAt,
        imagePath: imageUrl,
      }

      this.setState(prevState => {
        let updatedPosts = [...prevState.posts]
        if (prevState.editPost) {
          const postIndex = prevState.posts.findIndex(p => p._id === prevState.editPost._id)
          updatedPosts[postIndex] = post
        } else if (prevState.posts.length < 2) {
          updatedPosts = prevState.posts.concat(post)
        }
        return {
          posts: updatedPosts,
          isEditing: false,
          editPost: null,
          editLoading: false,
        }
      })
    } catch (err) {
      console.log(err)
      this.setState({
        isEditing: false,
        editPost: null,
        editLoading: false,
        error: err,
      })
    }
  }

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value })
  }

  deletePostHandler = postId => {
    this.setState({ postsLoading: true })

    const graphqlQuery = {
      query: `
        mutation {
          deletePost(postInput: {_id: "${postId}"}) {
            title
          }
        }
      `,
    }
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        // if (res.status !== 200 && res.status !== 201) {
        //   throw new Error('Deleting a post failed!')
        // }
        return res.json()
      })
      .then(resData => {
        console.log(resData)
        this.setState(prevState => {
          const updatedPosts = prevState.posts.filter(p => p._id !== postId)
          return { posts: updatedPosts, postsLoading: false }
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({ postsLoading: false })
      })
  }

  errorHandler = () => {
    this.setState({ error: null })
  }

  catchError = error => {
    this.setState({ error: error })
  }

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input type="text" placeholder="Your status" control="input" onChange={this.statusInputChangeHandler} value={this.state.status} />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? <p style={{ textAlign: 'center' }}>No posts found.</p> : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => {
                return (
                  <Post
                    key={post._id}
                    id={post._id}
                    author={post.creator}
                    currentUser={this.props.userId}
                    date={new Date(post.createdAt).toLocaleDateString('en-US')}
                    title={post.title}
                    image={post.imageUrl}
                    content={post.content}
                    onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                    onDelete={this.deletePostHandler.bind(this, post._id)}
                  />
                )
              })}
            </Paginator>
          )}
        </section>
      </Fragment>
    )
  }
}

export default Feed

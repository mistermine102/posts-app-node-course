import React, { Component } from 'react'

import Image from '../../../components/Image/Image'
import './SinglePost.css'

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: '',
  }

  componentDidMount() {
    const postId = this.props.match.params.postId

    const graphqlQuery = {
      query: `
      {
        getPost(id: "${postId}") {
          title
          content
          createdAt
          imageUrl
          creator {
            name
          }
        }
      }
      `
    }

    fetch(`http://localhost:8080/graphql`, {
      method: "POST",
      body: JSON.stringify(graphqlQuery),
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        "Content-Type": "application/json"
      },
    })
      .then(res => {
        return res.json()
      })
      .then(resData => {
        const { errors } = resData
        if (errors && errors.length) {
          console.log(errors);
          throw new Error(errors[0].message)
        }
        const {title, creator, createdAt, content, imageUrl} = resData.data.getPost

        this.setState({
          title,
          author: creator.name,
          date: new Date(createdAt).toLocaleDateString('en-US'),
          content,
          image: imageUrl
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={`http://localhost:8080/${this.state.image}`} />
        </div>
        <p>{this.state.content}</p>
      </section>
    )
  }
}

export default SinglePost

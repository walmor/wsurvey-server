# wSurvey - Back-end

This is the back-end part of the _wSurvey_ project, which is a simple project to demonstrate my full-stack software development skills, my knowledge of best practices and also is used to try out new things.

It's a simple survey app, similar to Google Forms, but is still a work in progress.

## Core

The back-end is a [GraphQL](https://graphql.org/) API built with Node.js and [Apollo Server](https://www.apollographql.com/docs/apollo-server/). GraphQL is a query language and a server runtime with which we can build a server API. It claims to solve some of the problems we have with REST APIs, such as under-fetching and over-fetching (improving performance) and also enhancing DX, as it allows [introspection](https://graphql.org/learn/introspection/).

## Database

[MongoDB](https://www.mongodb.com/) was chosen to persist data for two reasons. First, because we have a dynamic schema - different kinds of questions which one with its own set of properties - and, as we don't need to define a schema in a NoSQL database, it seemed easier to save the whole survey form as a document, instead of trying to define a schema to work with a relational database. Second, because I would like to play around with MongoDB and get more experience with it.

## Authentication

Beyond the regular authentication using email and password, the project is also implementing sign in with Google and Facebook. To encrypt the passwords I'm using the [bcrypt](https://www.npmjs.com/package/bcrypt) library.

The project is also using [Json Web Tokens (JWT)](https://jwt.io/) that are sent through the Authorization header, which is the most recommended way to build authentication for a stateless API.

## Linters

The project is using [ESLint](https://eslint.org), one of the most popular JavaScript linters, together with the rules provided by the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), with just some few customizations.

## Unit Tests

Unit tests were written using Jest.

## License

This project is [MIT licensed](LICENSE).

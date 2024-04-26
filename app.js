const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'moviesData.db')

let database = null

const initialiseDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at https://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initialiseDbAndServer()

const convertMovieDbObjectToResposeDbObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.leadActor,
  }
}

const convertDirectorDbObjectToResponseDbObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
    SELECT 
    movie_name
    FROM 
    movies;`

  const moviesArray = await database.all(getMoviesQuery)
  response.send(
    moviesArray.map((eachMovie) => ({movieName: eachMovie.movie_name})),
  )
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params

  const getMovieQuery = `
    SELECT 
    *
    FROM
    movie
    WHERE 
    movie_id= ${movieId};`

  const movie = await database.get(getMovieQuery)
  response.send(convertMovieDbObjectToResposeDbObject(movie))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body

  const postMovieQuery = `
    INSERT INTO
    movie (director_id , movie_name,lead_actor)
    VALUES
    (${directorId}, '${movieName}','${leadActor}');`
  await database.run(postMovieQuery)
  response.send('Movie Successfully Added')
})

app.put('/movies/:movieId/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body

  const {movieId} = request.params
  const updateMovieQuery = `
  UPDATE
  movie
  SET
  director_id = ${directorId},
  movie_name = '${movieName}',
  lead_actor = '${leadActor}'
  WHERE
  movie_id:${movieId};`

  await database.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM 
  movie 
  WHERE
  movie_id= ${movieId};`
  await database.run(deleteMovieQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorsQuery = `

  SELECT
  * 
  FROM
  director;`
  const directorsArray = await database.all(getDirectorsQuery)

  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseDbObject(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const directorMoviesQuery = `
  SELECT 
  movie_name
  FROM
  movie
  WHERE
  director_id='${directorId}';`
  const moviesArray = await database.all(directorMoviesQuery)

  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

module.exports = app

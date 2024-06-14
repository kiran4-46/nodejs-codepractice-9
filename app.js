const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// create user API
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const password_variable = `${password}`
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectQuery = ` SELECT * FROM user 
  WHERE username = '${username}';`
  const dbUser = await db.get(selectQuery)

  if (dbUser === undefined && password_variable.length >= 5) {
    console.log(password_variable)
    //create username in database
    const createUserQuery = `INSERT INTO user 
    (username, name, password, gender, location) 
    VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`
    const dbResponse = await db.run(createUserQuery)
    response.send('User created successfully')
  } else if (password_variable.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } 
  else {
    // send invalid name as response
    response.status(400)
    response.send('User already exists')
  }
})
// login user API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM user 
WHERE username = '${username}';`
  const dbUser = await db.get(selectQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    // send invalid name as response
    const isIdmatched = await bcrypt.compare(password, dbUser.password)
    if (isIdmatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// update userr password
app.put('/change-password/', async (request, response) => {
  const {username, newPassword, oldPassword} = request.body
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`
  const currentPasswordAstext = `${newPassword}`
  const dbUser = await db.get(selectQuery)
  const newPasswordAsText = `${newPassword}`
  const hashedPassword = await bcrypt.hash(newPasswordAsText, 10)
  if (dbUser !== undefined) {
    const isPasswordRight = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordRight === false) {
      response.status(400)
      response.send('Invalid current password')
    } else if (currentPasswordAstext.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const updateQuery = `UPDATE user SET 
      password = '${hashedPassword}';`
      await db.run(updateQuery)
      response.status = 200
      response.send('Password updated')
    }
  }
})
module.exports = app

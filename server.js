const express=require('express');
const bodyParser=require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');

const Clarifai = require('clarifai');


const app_api = new Clarifai.App({
 apiKey: 'fc48e7a9801d4706878752cdcba8dce6'
});

const handleApiCall = (req,res) =>{
  app_api.models.predict(Clarifai.FACE_DETECT_MODEL,req.body.input)
  .then(data => {
    res.json(data);
    console.log(data);
  })
  .catch(err =>res.status(400).json("unable to work with the api"))
}


const db = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    password : 'password',
    user : 'daksh',
    database : 'smart-brain'
  }
});

db.select('*').from('users').then(data => {
  console.log(data[0]);
});

const app=express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req,res) =>{
    res.send(database.users);
})

app.post('/signin', (req, res) => {
  const {email, password}=req.body;
  if (!email || !password) {
    return res.status(400).json('incorrect form submission');
  }
  db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json('incorrect form submission');
  }
  const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('users').where({id})
    .then(user => {
      if (user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch(err => res.status(400).json('error getting user'))
})
app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('unable to get entries'))
})


app.post('/imageurl',(req,res)=>{handleApiCall(req, res)})

app.listen(process.env.PORT || 3000, ()=>{
  console.log('the app is running on port ${process.env.PORT}');
})

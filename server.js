const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const shortId=require('shortid')
const moment = require('moment');
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true}); 
var Schema=mongoose.Schema;
var childSchema= new mongoose.Schema({description:String,duration:Number,date:Date})
var pSchema= new mongoose.Schema({_id:String,username:String,child:[childSchema]})
var Url= mongoose.model('Url', pSchema);
var Child=mongoose.model('Child',childSchema)
app.post('/api/exercise/new-user',(req,res,done)=>{
    var data=req.body.username
    var id = shortId.generate()
    Url.findOne({username:data},(err,doc)=>{
      if (err) throw err;
      else if (!doc){
        var Person = new Url({_id:id,username:data})
        Person.save((err,doce)=>{
        if (err) throw err;
        res.json({username:data,"_id":id})
        done(null,doce);
        })  
      }
      else{
        res.send('This username already exists')
      }
    })
})

  app.post('/api/exercise/add',(req,res,done)=>{
    if(req.body.date){
      var pack={"userId":req.body.userId,"description":req.body.description,"duration":req.body.duration,"date":new Date(req.body.date).toDateString()}
    }
    else{
      var pack={"userId":req.body.userId,"description":req.body.description,"duration":req.body.duration,"date":new Date().toDateString()}
    }
    //console.log(pack)
    if(req.body.userId && req.body.description && req.body.duration && pack.date!=='Invalid Date'){
      Url.findById(req.body.userId,(err,data)=>{
        data.child.push({description:pack.description,duration:pack.duration,date:pack.date})
        data.save((err,doc)=>{
          if(err) throw err;
          res.json({"username":doc.username,"description":pack.description,"duration":Number(req.body.duration),"_id":doc._id,"date":pack.date})
          done(null,doc)
        })
      })
    }
    else if(pack.date=='Invalid Date'){
      res.send('Incorrect Date')
    }
      else{
        res.send("Sorry, a compulsory field isn't filled")
      }
  })
///api/exercise/log?userId=z5sjA4X2y
app.get('/api/exercise/users',(req,res,done)=>{
  Url.find((err,doc)=>{
    var id=doc.map((i)=>{return{id:i._id,username:i.username}})
    res.json(id)
  })
})  
app.get('/api/exercise/log',(req,res,done)=>{
  var id=req.query.userId? req.query.userId :'No id inputted'
  var from=req.query.from? new Date(req.query.from) : null
  var to=req.query.to? new Date(req.query.to) : null
  var lim = req.query.limit? Number(req.query.limit) : null
  //console.log(typeof(lim))
  if(id === 'No id inputted'){
    res.send('No id inputted')
  }
  else{
    var seek = Url.findOne({_id:id},(err,doc)=>{
    if (err) throw err;
    //console.log(from,to,lim)
    if(from !== null && to !==null){
        var childe=lim !==null? doc.child.filter((j)=> j.date!=='Invalid Date').sort((a,b)=> a.date-b.date).filter((i)=> i.date>=from).filter((j)=> j.date<=to).slice(0,lim) : doc.child.filter((j)=> j.date!=='Invalid Date').sort((a,b)=> a.date-b.date).filter((i)=> i.date>=from).filter((j)=> j.date<=to)
        res.json({"_id":doc._id,"username":doc.username,"count":childe.length,"log":childe})
    }
    else if(from === null && to!==null){
      var childre=lim !== null? doc.child.filter((j)=> j.date!=='Invalid Date').sort((a,b)=> a.date-b.date).filter((i)=> (i.date<=to)).slice(0,lim) : doc.child.filter((j)=> j.date!=='Invalid Date').sort((a,b)=> a.date-b.date).filter((i)=> (i.date<=to))
      res.json({"_id":doc._id,"username":doc.username,"count":childre.length,"log":childre})
    }
    else if(to === null && from!==null){
      var childer=lim !==null? doc.child.filter((j)=> j.date!=='Invalid Date').sort((a,b)=> a.date-b.date).filter((i)=> (i.date>=from)).slice(0,lim) : doc.child.filter((j)=> j.date!=='Invalid Date').sort((a,b)=> a.date-b.date).filter((i)=> (i.date>=from))
      res.json({"_id":doc._id,"username":doc.username,"count":childer.length,"log":childer})
    }
    else{
      if(lim !== null){
        res.json({"_id":doc._id,"username":doc.username,"count":doc.child.slice(0,lim).length,"log":doc.child.slice(0,lim)})}
      else{
        res.json({"_id":doc._id,"username":doc.username,"count":doc.child.length,"log":doc.child})}
    }
    done(null,doc)
  })
  }
  })
  ///api/exercise/log?userId=uIjnWryIq&from=2014-11-01&to=2020-05-21&limit=10
//Not found middleware
app.use((req, res, next) => {
  return next()//{status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

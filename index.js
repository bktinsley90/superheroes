// variables set
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const passport = require('passport'); // adding passport
const flash = require('express-flash'); 
const session = require('express-session'); 
const methodOverride = require('method-override')

// pulling in Mongodb to store data
const mongodb = require('mongodb')
// the bridge between node and mongo
let mongoClient = mongodb.MongoClient;
const PORT = process.env.PORT || 4040;
const users = []
// encryting passwords
const bcrypt = require('bcrypt')


// body-parser setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}))
  
app.set('view engine', 'ejs')
app.use(session({ 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }));
app.use(flash()); // using connect-flash to show error messages

app.use(passport.initialize()); // middleware is required to initialize Passport
 app.use(passport.session()); // needed if the app is persistent login sessions (MongoDB)
app.use(methodOverride('_method'))
 // // ability to use public folder that stores static filesß
app.use(express.static(path.join(__dirname, 'public')))


// Local mongoDb const URL = 'mongodb://localhost:27017';
let db_handler;
const db_url = process.env.db_url
const  db_name = process.env.db_name;
const COLLECTION_FILM = process.env.COLLECTION_FILM;
const COLLECTION_COMICS = process.env.COLLECTION_COMICS;
const COLLECTION_COSPLAY =process.env.COLLECTION_COSPLAY;



const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email =>  users.find(user => user.email === email),
    id => users.find(user => user.id === id)
    ),



// routes to other pages
app.get('/', (req, res) => {
    // res.send('Hello World');
    res.render('pages/index');
});

app.get('/shows', (req,res) => {
  
    db_handler.collection(COLLECTION_FILM).find({}).toArray((err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            // console.log(result);
            res.render('pages/shows', {
                'superHeros': result
            });
        }
    });
})
// db.collection(COLLECTION_FILM).find({name: "name"}).toArray((err,result) => {
//     if(err) {
//         console.log(err);
        // res.send("Character not found");
//     }else{
//         res.render('pages/shows', result)
//     }
// })


app.get('/comic', (req,res) => {
     db_handler.collection(COLLECTION_COMICS).find({}).toArray((err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    // console.log(result);
                    res.render('pages/comic', {
                        'comicHeros': result
                    });
                }
        })
    
});       

app.get('/cosplay', (req,res) => {

    db_handler.collection(COLLECTION_COSPLAY).find({}).toArray((err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            // console.log(result);
            res.render('pages/cosplay', {
                'cosplayHeros': result
            });
        }
    
    });
});

app.get('/contact', (req,res) => {
    // res.send('hello world')
    res.render('pages/contact')
})
app.get('/login', checkAuthenticated, (req,res) => {
    res.render('pages/login', {name: req.user.name})
});
app.get('/register', checkNotAuthenticated, (req,res) => {
    res.render('pages/register')
})
//  I want grab data from page store in an array and display on page
// shows page
app.post('/add', (req, res) => {
    console.log('got a post request')
    const form_data = req.body;
    console.log(form_data);
    let name = form_data['charName'];
    let picture = form_data['pic'];
    let description = form_data['description'];

    const my_Object ={
        "name": name,
        "picture": picture,
        "description": description
    }

    db_handler.collection(COLLECTION_FILM).insertOne(my_Object, (err, result) => {
        if (err) {
            console.log("Error: " + err);
        }
        else {
            console.log("One Entry Added");
            res.redirect('/shows');
        }
    });
    // superHeros.push(my_Object)
});

// comics page
app.post('/addComic', (req,res) => {
    console.log('got a post request')
    const form_data = req.body;
    console.log(form_data);
    let name = form_data['charName'];
    let picture = form_data['pic'];
    let description = form_data['description'];

    const my_Object ={
        "name": name,
        "picture": picture,
        "description": description
    }

    db_handler.collection(COLLECTION_COMICS).insertOne(my_Object, (err, result) => {
        if (err) {
            console.log("Error: " + err);
        }
        else {
            console.log("One Entry Added");
            res.redirect('/comic');
        }
    });
});

// // cosplay page
app.post('/addCosplay', (req,res) => {
    // console.log('got a post request')
    const form_data = req.body;
    // console.log(form_data);
    let name = form_data['charName'];
    let picture = form_data['pic'];
    let description = form_data['description'];

    const my_Object ={
        "name": name,
        "picture": picture,
        "description": description
    }
    db_handler.collection(COLLECTION_COSPLAY).insertOne(my_Object, (err, result) => {
        if (err) {
            console.log("Error: " + err);
        }
        else {
            console.log("One Entry Added");
            res.redirect('/cosplay');
        }
    })
});

app.post('/login', passport.authenticate('local', {
    // res.redirect('pages/index')
    successRedirect: '/login', 
    failureRedirect: '/',
    FailureFlash: true // NEW! this will turns on the error message for connect-flas

}))


app.post('/register1', async (req, res) => {

    
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id:Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        
        // db_handler.collection(COLLECTION_USERS).insertOne(my_Object, (err, result) => {
        //     if (err) {
        //         console.log("Error: " + err);
        //     }
        //     else {
        //         console.log("One Entry Added");
        //         res.render('pages/index');
        //     }
        // })
        res.redirect('/login')
    } catch {
        res.redirect('/register');
    }
    console.log(users)
})
app.delete('/logout', (req,res) => {
    req.logOut()
    res.redirect('/')
})

function checkAuthenticated(req,res,next){
 if(req.isAuthenticated()){
     return next()
 }   
 res.redirect('/')
}

function checkNotAuthenticated(req,res,next){
    if (req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}
// listening to PORT
app.listen(PORT, () => {
    console.log('its working I think on PORT'+ PORT);

    mongoClient.connect(db_url, (err,db) => {
        if(err) { 
            console.log(err); 
        } else {
            console.log('connected to database');
            // open database
            db_handler = db.db(db_name);
        }
    });
});

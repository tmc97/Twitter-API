"use strict";

//Imports, modules, libraries, etc.
const express = require("express"),
    hoffman = require("hoffman"),
    path = require("path"),
    passport = require("passport"),
    TwitterStrategy = require("passport-twitter").Strategy,
    bodyParser = require("body-parser"),
    authConfig = require("./modules/authConfig"),
    authHandling = require("./modules/authHandling"),
    https = require("https")
;

const app = express();
//Wire up the view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "dust");
app.engine("dust", hoffman.__express());

const listeningPort = parseInt(process.argv[2]) || 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Add the express-session middleware so we can use sessions & cookies
app.use(require("express-session")({
    secret: "secret stuff",
    resave: true,
    saveUninitialized: true
}));

//Initialize passport for authentication
app.use(passport.initialize());
app.use(passport.session());

//Configure the Twitter authentication strategy

let twitterOptions = {
    consumerKey: authConfig.TWITTER_CONSUMER_KEY,
    consumerSecret: authConfig.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
};

let twitterAuthStrat = "twitter-auth";
passport.use(twitterAuthStrat, new TwitterStrategy(twitterOptions,
    (token, tokenSecret, profile, done) => {
        //token and tokenSecret we'll discuss a bit more on Wednesday
        done(null, {
            profile: profile,
            token: token,
            tokenSecret: tokenSecret
        });
    }
));


passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

app.get("/home",
    (request, response) => {
        if (request.user) { 
            let user = request.user;
            let searchSpecificOptions = Object.assign(searchOptions, {});

            searchSpecificOptions.path += "?q=%23csc365&count=100";

            searchSpecificOptions["headers"] = authHandling.getSecondOauthHeader(authConfig.TWITTER_CONSUMER_KEY,
                authConfig.TWITTER_CONSUMER_SECRET,
                user.token,
                user.tokenSecret);

            //Build the HTTP request to Twitter and handle their response
            let requestToTwitter = https.request(searchSpecificOptions, (responseFromTwitter) => {
                let allTweets;
                //console.log(allTweets);
                responseFromTwitter.on("data", (tweets) => {
                    if (allTweets) { 
                        allTweets += tweets;
                    } else {
                        allTweets = tweets;
                    }
                });
            
                responseFromTwitter.on("error", (err) => {
                    console.error(err);
                });
                responseFromTwitter.on("end", () => {
                    let parsedTweets = JSON.parse(allTweets.toString());
                    response.render("loggedin", parsedTweets);
                });
            });
            requestToTwitter.end(); //We always have to explicitly end the request

        } else { //If not, we'll send them back to the login page
            response.redirect("/auth/twitter");
        }
    });

app.get("/csc365", (request, response) => {
    if (request.user) { 
        let user = request.user;
        let searchSpecificOptions = Object.assign(searchOptions2, {}); //clone the base object so we have a new one on every request

        searchSpecificOptions.path += "?q=%23csc365&count=100";
        searchSpecificOptions["headers"] = authHandling.getOauthHeader(authConfig.TWITTER_CONSUMER_KEY,
            authConfig.TWITTER_CONSUMER_SECRET,
            user.token,
            user.tokenSecret);

        //Build the HTTP request to Twitter and handle their response
        let requestToTwitter = https.request(searchSpecificOptions, (responseFromTwitter) => {
            let allTweets;
            responseFromTwitter.on("data", (tweets) => {
                if (allTweets) { 
                    allTweets += tweets;
                } else {
                    allTweets = tweets;   
                }
            });
            responseFromTwitter.on("error", (err) => {
                console.error(err);
            });
            responseFromTwitter.on("end", () => {
                let parsedTweets = JSON.parse(allTweets.toString());
                for (let i = 99; i > -1; i--) {
                    if (parsedTweets.statuses[i].favorite_count < 2) {
                        parsedTweets.statuses.splice([i], 1);
                    }
                }
                response.render("hashtag", parsedTweets);
            });
        });
        requestToTwitter.end();
    } else {
        response.redirect("/auth/twitter");
    }
});

    
app.get("/protected",
    (request, response) => {
        if (request.user) { //check that they're logged in...
            response.render("protected", request.user.profile._json);
        } else { //If not, we'll send them back to the login page
            response.redirect("/auth/twitter");
        }
    }
);



app.get("/", (request, response) => {
    response.render("index", {});
});

app.get("/auth/twitter", passport.authenticate(twitterAuthStrat));

// Twitter will redirect the user to this URL after approval.
app.get("/auth/twitter/callback", passport.authenticate(twitterAuthStrat, {
    successRedirect: "/home",
    failureRedirect: "/"
}));

app.get("/auth/logout", (request, response) => {
    request.logout();
    response.redirect("/");
});

let searchOptions = {
    hostname: "api.twitter.com",
    port: 443,
    path: "/1.1/search/tweets.json",
    method: "GET",
};
let searchOptions2 = {
    hostname: "api.twitter.com",
    port: 443,
    path: "/1.1/search/tweets.json",
    method: "GET",
};

//Link to resources folder
app.use("/resources", express.static("resources"));


app.listen(listeningPort, () => {
    console.log(`My app is listening on port ${listeningPort}!`);
});
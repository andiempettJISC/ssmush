import express from 'express'
import cookieSession from 'cookie-session'
import { body, validationResult } from 'express-validator'
import parser from 'body-parser'
import pino from 'pino'
import http from 'http'
import path from 'path'
import { createTerminus } from '@godaddy/terminus'
import helmet from 'helmet'
import { deployment, deployments, Ssmush } from '@androidwiltron/ssmush'
import passport from 'passport'
import {Strategy} from 'passport-google-oauth20'


const app = express()
const logger = pino()

const app_name = process.env.APP_NAME || process.env.name || process.env.npm_package_name
const googleClientId = process.env.GOOGLE_CLIENT_ID!
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!
const googleOrgName = process.env.GOOGLE_ORG_NAME
const sessionMaxAge = Number(process.env.SESSION_MAX_AGE) || 600000
const secretMinLength = Number(process.env.SECRET_MIN_LENGTH) || 16

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(parser.urlencoded({ extended: false }))
app.use(parser.json())

// magic web security and best practice
app.use(helmet())

app.use(cookieSession({
  name: "__session",
  keys: ["key1"],
  maxAge: sessionMaxAge,
}))

app.use(passport.initialize())
app.use(passport.session())

const authUser = (request: any, accessToken: any, refreshToken: any, profile: { _json: any; }, done: (arg0: null, arg1: any) => any) => {
  if (profile._json.hd !== googleOrgName) {
    return done(null, false);
  } else {
    return done(null, profile);
  }

}

//Use "GoogleStrategy" as the Authentication Strategy
passport.use(new Strategy({
  clientID: googleClientId,
  clientSecret: googleClientSecret,
  callbackURL: "http://localhost:3001/auth/google/callback",
  passReqToCallback: true
}, authUser));


passport.serializeUser((user: any, done: (arg0: null, arg1: any) => void) => {
  done(null, user)
})


passport.deserializeUser((user: any, done: (arg0: null, arg1: any) => void) => {
  done(null, user)
})

function onSignal () {
  logger.info('server is starting cleanup')

  return Promise.allSettled([]);
}

async function onHealthCheck () {}

const server = http.createServer(app)
createTerminus(server, {
  signal: 'SIGINT',
  healthChecks: { '/healthcheck': onHealthCheck },
  onSignal
});
server.listen(3001, () => logger.info('Server started on port 3001...'))


const initAuth = function(req: any, res: any, next: any) {

  logger.debug('req.session.passport')
  logger.debug('req.user')
  logger.debug('req.session.id')
  logger.debug('req.session.cookie')

  res.locals.userValue = null;
  res.locals.errorMessage = null;
  res.locals.environments = deployments
  next()
}

app.use(initAuth)


app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    hd: googleOrgName,
    prompt: 'select_account'
  }
  ));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/auth/google'
  }));

const checkAuthenticated = (req: { isAuthenticated: () => any; }, res: { redirect: (arg0: string) => void; }, next: () => any) => {
  if (req.isAuthenticated()) { return next() }
  res.redirect("/auth/google")
}

app.get("/", checkAuthenticated, (req: { user: { displayName: any; }; }, res: any) => {
  res.render("dashboard.ejs")
})

//Define the Logout
app.get("/logout", (req: { logOut: () => void; }, res: { redirect: (arg0: string) => void; }) => {
  req.logOut()
  res.redirect("/auth/google")
  logger.debug('User logged out')
})

interface FormBody {
  appName: string
  environments: deployment
  password: string
  secretName: string
}

interface CustomRequest<T> extends Express.Request {
  body: T
}

app.post('/',

  checkAuthenticated,
  body('environments').isIn(deployments),
  body('password').isLength({ min: secretMinLength }),
  async function (req: CustomRequest<FormBody>, res: any) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ status: 1, message: errors.array() });
    }

    const createSecret = new Ssmush({
      secretName: `/${req.body.environments}/key/${req.body.appName}/${req.body.secretName}`,
      secretValue: req.body.password
    })

    let secretRequest
    try {
      secretRequest = await createSecret.createSecret()
    } catch (error) {

      logger.error(error)

      res.render('dashboard', {
        errorMessage: error
      });

      return
    }

    var secretResponse = {
      secretKey: createSecret.secretName,
      secretVersion: secretRequest?.version
    }

    // FIXME why do i have to cast to any type. ???
    const user = req.user as any

    const child = logger.child({ emailAddress: user.email })
    child.info(secretResponse)

    res.render('dashboard', {
      userValue: secretResponse,
    });
  });

import { deployments } from '@androidwiltron/ssmush'
import passport from 'passport'
import { Strategy } from 'passport-google-oauth20'
import { Config, logger } from './config'

const config = new Config()

export const auth = function (app: any) {

    app.use(passport.initialize())
    app.use(passport.session())

    const authUser = (request: any, accessToken: any, refreshToken: any, profile: { _json: any; }, done: (arg0: null, arg1: any) => any) => {
        if (profile._json.hd !== config.googleOrgName) {
            return done(null, false);
        } else {
            return done(null, profile);
        }

    }

    passport.use(new Strategy({
        clientID: config.googleClientId!,
        clientSecret: config.googleClientSecret!,
        callbackURL: "/auth/google/callback",
        passReqToCallback: true,
        proxy: true,

    }, authUser));


    passport.serializeUser((user: any, done: (arg0: null, arg1: any) => void) => {
        done(null, user)
    })


    passport.deserializeUser((user: any, done: (arg0: null, arg1: any) => void) => {
        done(null, user)
    })

    const initAuth = function (req: any, res: any, next: any) {

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
}
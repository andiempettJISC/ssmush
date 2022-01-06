import express from 'express'
import { body, validationResult } from 'express-validator'
import { deployment, deployments, Ssmush } from '@androidwiltron/ssmush'
import { Config, logger } from './config'
import passport from 'passport'

const config = new Config()

export interface FormBody {
  appName: string
  environments: deployment
  password: string
  secretName: string
}

export interface CustomRequest<T> extends Express.Request {
  body: T
}

export const routes = function (app: express.Application) {


  const checkAuthenticated = (req: { isAuthenticated: () => any; }, res: { redirect: (arg0: string) => void; }, next: () => any) => {
    if (req.isAuthenticated()) { return next() }
    res.redirect("/auth/google")
  }

  app.get('/auth/google',
    passport.authenticate('google', {
      scope: ['email', 'profile'],
      hd: config.googleOrgName,
      prompt: 'select_account'
    }
    ));

  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/',
      failureRedirect: '/auth/google'
    }));

  app.get("/", checkAuthenticated, function (req: any, res: any) {
    res.render("dashboard.ejs")
  })

  app.get("/logout", (req: { logOut: () => void; }, res: { redirect: (arg0: string) => void; }) => {
    req.logOut()
    res.redirect("/auth/google")
    logger.debug('User logged out')
  })

  app.post('/',
    checkAuthenticated,
    body('environments').isIn(deployments),
    body('password').isLength({ min: config.secretMinLength }),
    async function (req: CustomRequest<FormBody>, res: any) {

      // FIXME why do i have to cast to any type. ???
      let user = req.user as any
      const loggerChild = logger.child({ emailAddress: user._json.email })

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ status: 1, message: errors.array() });
      }

      const createSecret = new Ssmush({
        secretName: `/${req.body.environments}/key/${req.body.appName}/${req.body.secretName}`,
        secretValue: req.body.password,
        extraTags: [
          {Key: 'CreatedBy', Value: user._json.email}
        ]
      })

      let secretRequest
      try {
        secretRequest = await createSecret.createSecret()
      } catch (error) {

        loggerChild.error(error)

        res.render('dashboard', {
          errorMessage: error
        });

        return
      }

      var secretResponse = {
        secretKey: createSecret.secretName,
        secretVersion: secretRequest?.version
      }

      loggerChild.info(secretResponse)

      res.render('dashboard', {
        userValue: secretResponse,
      });
    });

}
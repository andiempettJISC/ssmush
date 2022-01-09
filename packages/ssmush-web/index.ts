import express from 'express'
import cookieSession from 'cookie-session'
import parser from 'body-parser'
import http from 'http'
import path from 'path'
import { createTerminus } from '@godaddy/terminus'
import helmet from 'helmet'
import noCache from 'nocache'
import { routes } from './router'
import { auth } from './auth'
import { Config, logger } from './config'

const config = new Config()
const app = express()

app.set('trust proxy', true)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(parser.urlencoded({ extended: false }))
app.use(parser.json())

// magic web security and best practice
app.use(helmet({
  hidePoweredBy: true,
  noSniff: true,
}))
app.use(noCache())

app.use(cookieSession({
  name: "__session",
  keys: [config.sessionSecret],
  maxAge: config.sessionMaxAge,
}))

auth(app)
routes(app)

function onSignal() {
  logger.info('server is starting cleanup')

  return Promise.allSettled([]);
}

async function onHealthCheck() { }

const server = http.createServer(app)

createTerminus(server, {
  signal: 'SIGINT',
  healthChecks: { '/healthcheck': onHealthCheck },
  onSignal
});

server.listen(3001, () => logger.info('Server started on port 3001...'))
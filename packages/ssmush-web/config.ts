
import pino from 'pino'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

export let logger = pino()

export class Config {
    app_name: string
    googleClientId: string | undefined
    googleClientSecret: string | undefined
    googleOrgName: string | undefined
    sessionSecret: string
    sessionMaxAge: number
    secretMinLength: number

    constructor() {
        this.app_name = process.env.APP_NAME || process.env.name || process.env.npm_package_name || 'ssmush-web'
        this.sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(20).toString("hex")
        this.sessionMaxAge = Number(process.env.SESSION_MAX_AGE) || 600000
        this.secretMinLength = Number(process.env.SECRET_MIN_LENGTH) || 16

        this.googleClientId = this.isDefined(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID') ? process.env.GOOGLE_CLIENT_ID : undefined
        this.googleClientSecret = this.isDefined(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET') ? process.env.GOOGLE_CLIENT_SECRET : undefined
        this.googleOrgName = this.isDefined(process.env.GOOGLE_ORG_NAME, 'GOOGLE_ORG_NAME') ? process.env.GOOGLE_ORG_NAME : undefined
    }

    isDefined(confValue: string | undefined, confName: string) {

        if (confValue && confValue !== '') {
            return true
        } else {
            logger.error(`${confName} is ${confValue}`)
            throw new Error(`An google org name is undefined. Use the '${confName}' env var`)
        }
    }
}
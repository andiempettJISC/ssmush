
import pino from 'pino'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

export let logger = pino()

export class Config {
    app_name: string
    googleClientId: string | undefined
    googleClientSecret: string | undefined
    googleOrgName: string
    sessionSecret: string
    sessionMaxAge: number
    secretMinLength: number

    constructor() {
        this.app_name = process.env.APP_NAME || process.env.name || process.env.npm_package_name || 'ssmush-web'
        this.googleClientId = process.env.GOOGLE_CLIENT_ID
        this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
        this.sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(20).toString("hex")
        this.sessionMaxAge = Number(process.env.SESSION_MAX_AGE) || 600000
        this.secretMinLength = Number(process.env.SECRET_MIN_LENGTH) || 16

        if (process.env.GOOGLE_ORG_NAME && process.env.GOOGLE_ORG_NAME !== '') {
            this.googleOrgName = process.env.GOOGLE_ORG_NAME
        } else {
            logger.error(`GOOGLE_ORG_NAME is ${process.env.GOOGLE_ORG_NAME}`)
            throw new Error("An google org name is undefined. Use the 'GOOGLE_ORG_NAME' env var");
            
        }
    }
}
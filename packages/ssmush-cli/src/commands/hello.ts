import {Command, flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import {Ssmush, environment, environments} from '@androidwiltron/ssmush'

// Work around to make exported const assertions not readonly
const mutable = <T>(t: T): { -readonly [K in keyof T]: T[K] } => t

export class MyCommand extends Command {
  static flags = {
    stage: flags.string({options: mutable(environments)})
  }

  async run() {
    const {flags} = this.parse(MyCommand)
    let stage = flags.stage
    const deploymentChoices = environments.map(name => ({ name }))
    
    if (!stage) {
      let responses: any = await inquirer.prompt([{
        name: 'stage',
        message: 'select a stage',
        type: 'list',
        choices: deploymentChoices,
      }])
      stage = responses.stage
    }

    // FIXME what if no stage selected?

    let SecretKeyResponse: any = await inquirer.prompt([{
      name: 'secretKey',
      message: 'Input the Name of the secret',
      type: 'input'
    }])
    const secretKey = SecretKeyResponse.secretKey

    // FIXME what if nothing inputted?

    let generatedResponse = await inquirer.prompt([{
      name: 'generate',
      message: 'Would you like to generate a strong password',
      type: 'confirm',
      default: false
    }])
    
    if (generatedResponse.generate) {
      // call the generate password method
      const deploymentStage = stage as environment

      const SsmushClient = new Ssmush({
        secretName: `/${deploymentStage}/key/app/${secretKey}`,
        generatePassword: true
      })

      const secretVersion = await SsmushClient.createSecret()

      this.log(`Secret /${deploymentStage}/key/app/${secretKey} version ${secretVersion?.version}`)

    } else {

      const getSecretInput = await inquirer.prompt([{
        name: 'secretInput',
        message: 'generate a password',
        type: 'password',
        default: false,
        mask: '🤫'
      }])

      const deploymentStage = stage as environment

      const SsmushClient = new Ssmush({
        secretName: `/${deploymentStage}/key/app/${secretKey}`,
        secretValue: getSecretInput.secretInput
      })

      const secretVersion = await SsmushClient.createSecret()

      this.log(`Secret /${deploymentStage}/key/app/${secretKey} version ${secretVersion?.version}`)
    }

    
  }
}
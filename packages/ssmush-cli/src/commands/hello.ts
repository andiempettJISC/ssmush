import {Command, flags} from '@oclif/command'
import * as inquirer from 'inquirer'
import {Ssmush, deployment} from 'ssmush'

export class MyCommand extends Command {
  static flags = {
    stage: flags.string({options: ['development', 'staging', 'production']})
  }
  

  async run() {
    const {flags} = this.parse(MyCommand)
    let stage = flags.stage
    if (!stage) {
      let responses: any = await inquirer.prompt([{
        name: 'stage',
        message: 'select a stage',
        type: 'list',
        choices: [{name: 'development'}, {name: 'staging'}, {name: 'production'}],
      }])
      stage = responses.stage
    }

    let ham = await inquirer.prompt([{
      name: 'generate',
      message: 'generate a password',
      type: 'confirm',
      default: false
    }])

    if (ham) {
      // call the generate password method
      const thing = stage as deployment

      const SsmushClient = new Ssmush({
        secretName: `/${thing}/key/app/cool`,
        generatePassword: true
      })

      const secretVersion = await SsmushClient.createSecret()

      console.log(secretVersion?.version)
    } else {

      const getSecretInput = await inquirer.prompt([{
        name: 'secretInput',
        message: 'generate a password',
        type: 'password',
        default: false,
        mask: '🤫'
      }])

      const thing = stage as deployment

      const SsmushClient = new Ssmush({
        secretName: `/${thing}/key/app/cool`,
        secretValue: getSecretInput.secretInput
      })

      const secretVersion = await SsmushClient.createSecret()

      console.log(secretVersion?.version)
    }

    this.log(`the stage is: ${stage}`)
  }
}
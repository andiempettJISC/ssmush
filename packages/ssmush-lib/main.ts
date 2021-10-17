import { Ssmush } from './index'

(async () => {
    const SsmushClient = new Ssmush({
        secretName: '/staging/key/app/cool',
        secretValue: 'sandwich',
    })

    const secretVersion = await SsmushClient.createSecret()

    console.log(secretVersion?.version)

  })();
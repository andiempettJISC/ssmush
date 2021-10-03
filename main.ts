import { Ssmush } from './index'

(async () => {
    const SsmushClient = new Ssmush({
        secretName: 'ham',
        secretValue: 'sandwich'
    })

    const secretVersion = await SsmushClient.createSecret()

    console.log(secretVersion?.version)

  })();
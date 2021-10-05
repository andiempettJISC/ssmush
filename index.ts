import { SSMClient, PutParameterCommand, PutParameterRequest, PutParameterResult, SSMClientConfig, PutParameterCommandOutput,  } from "@aws-sdk/client-ssm";

export type SsmType = 'String' | 'StringList' | 'SecureString'

export type deployment = 'common' | 'staging' | 'test' | 'dev' | 'prod' | 'infrastructure'

export type paramKey = `/${deployment}/key/${string}/${string}`

export interface ssmushParams {
    awsEndpoint?: string
    secretName: string
    secretValue: string
    secretKey: paramKey
}

export interface ssmushConfig {
    KmsKeyId?: string
}

interface secretVersionOutput {
    version:  number | undefined
}

export class Ssmush {
    private KmsKeyId?: string
    private awsEndpoint?: string
    private client: SSMClient
    private secretValue: string
    secretName: string
    SsmType: SsmType

    constructor(parameters: ssmushParams, config?: ssmushConfig) {
        
        this.KmsKeyId = config ? config.KmsKeyId : process.env.AWS_KMS_ID,
        this.awsEndpoint = parameters.awsEndpoint || process.env.AWS_ENDPOINT_URL,
        this.secretName = parameters.secretName
        this.secretValue = parameters.secretValue
        this.SsmType = "SecureString"

        this.client = new SSMClient({
            endpoint: this.awsEndpoint
        })

    }

    // simply choosing structure

    // conditional enforce / validate using kms

    // get a secret from secrets manager

    public async createSecret(updateSecret?: boolean) : Promise<secretVersionOutput | undefined> {

        const command = new PutParameterCommand({
            Name: this.secretName,
            Value: this.secretValue,
            Type: this.SsmType,
            KeyId: this.KmsKeyId,
            Overwrite: updateSecret,
        })

        try {
            const results: PutParameterCommandOutput = await this.client.send(command)
            
            return {"version": results.Version}

        } catch (error: any) {            
            if (error.name === 'ParameterAlreadyExists') {
                const newResult = await this.createSecret(updateSecret=true)
                return newResult

            } else {
                console.log(error)
                return undefined
            }
        }

    }

}

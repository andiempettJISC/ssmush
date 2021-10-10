import { SSMClient, PutParameterCommand, PutParameterRequest, PutParameterResult, SSMClientConfig, PutParameterCommandOutput,  } from "@aws-sdk/client-ssm";
import { GetRandomPasswordCommand, SecretsManagerClient, GetRandomPasswordCommandOutput, GetRandomPasswordCommandInput, GetRandomPasswordRequest, GetRandomPasswordResponse } from '@aws-sdk/client-secrets-manager'

export type SsmType = 'String' | 'StringList' | 'SecureString'

export type deployment = 'common' | 'staging' | 'test' | 'dev' | 'prod' | 'infrastructure'

export type paramKey = `/${deployment}/key/${string}/${string}`

export interface ssmushParams {
    // The name of the secret
    secretName: paramKey
    // The value for the secret
    secretValue?: string
    // Generate a random password to use for the value
    generatePassword?: boolean
}

export interface ssmushConfig {
    KmsKeyId?: string
    awsEndpoint?: string
    generatePasswordLength?: number
}

interface secretVersionOutput {
    version:  number | undefined
}

export class Ssmush {
    private KmsKeyId?: string
    private awsEndpoint?: string
    private client: SSMClient
    private secMgrClient: SecretsManagerClient
    private secretValue: string | undefined
    private generatePassword: boolean
    private generatePasswordLength?: number
    secretName: string
    SsmType: SsmType

    constructor(parameters: ssmushParams, config?: ssmushConfig) {
        
        this.KmsKeyId = config ? config.KmsKeyId : process.env.AWS_KMS_ID
        this.awsEndpoint = config ? config.awsEndpoint : process.env.AWS_ENDPOINT_URL
        this.secretName = parameters.secretName
        this.secretValue = parameters.secretValue
        this.SsmType = "SecureString"

        this.generatePassword = parameters.generatePassword || false
        this.generatePasswordLength = config ? config.generatePasswordLength : Number(process.env.AWS_ENDPOINT_URL) || 32

        this.client = new SSMClient({
            endpoint: this.awsEndpoint
        })

        this.secMgrClient = new SecretsManagerClient({
            endpoint: this.awsEndpoint
        })

    }

    // simply choosing structure

    // conditional enforce / validate using kms

    // create a secret with secrets manager
    private async generateSecret() : Promise<string | undefined>  {

        const randomPasswordCommand = new GetRandomPasswordCommand({
            PasswordLength: this.generatePasswordLength
        })

        try {
            const results: GetRandomPasswordCommandOutput = await this.secMgrClient.send(randomPasswordCommand)

            return results.RandomPassword
        } catch (error) {
            console.log(error)
            throw error
        }
        
    }

    public async createSecret(updateSecret?: boolean) : Promise<secretVersionOutput | undefined> {

        const secretValue = this.secretValue || await this.generateSecret()

        const command = new PutParameterCommand({
            Name: this.secretName,
            Value: secretValue,
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

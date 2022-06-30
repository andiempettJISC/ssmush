import { SSMClient, PutParameterCommand, PutParameterRequest, PutParameterResult, SSMClientConfig, PutParameterCommandOutput, Tag, ListTagsForResourceCommand, ListTagsForResourceRequest } from "@aws-sdk/client-ssm";
import { GetRandomPasswordCommand, SecretsManagerClient, GetRandomPasswordCommandOutput, GetRandomPasswordCommandInput, GetRandomPasswordRequest, GetRandomPasswordResponse } from '@aws-sdk/client-secrets-manager'

export type SsmType = 'String' | 'StringList' | 'SecureString'

export const environments =  process.env.environments ? process.env.environments.split(',') : ['staging', 'test', 'dev', 'prod'] as const
export type environment = typeof environments[number]

export type paramKey = `/${environment}/key/${string}/${string}`

export interface ssmushParams {
    // The name of the secret
    secretName: paramKey
    // The value for the secret
    secretValue?: string
    // Generate a random password to use for the value
    generatePassword?: boolean
    /**
     * Pass the name of the app/lib to tag resources.
     * @default: 'ssmush'
     */
    appName?: string
    /**
     * Extra resource tags to add. 
     * They may provide valuble metadata for auditing and attribution
     * @default: []
     */
    extraTags?: Array<Tag>
}

export interface ssmushConfig {
    KmsKeyId?: string
    awsEndpoint?: string
    generatePasswordLength?: number
    /**
     * Controls if existing unmanaged parameters/secrets can be overwitten.
     * Evaluates existing tags including a special 'ManagedBy' tag on the resource.
     * @default: false
     */
    overwriteUnmanaged?: boolean
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
    private overwriteUnmanaged: boolean | undefined
    secretName: string
    SsmType: SsmType
    appName: string | undefined
    extraTags: Array<Tag>

    constructor(parameters: ssmushParams, config?: ssmushConfig) {
        
        this.KmsKeyId = config ? config.KmsKeyId || process.env.AWS_KMS_ID : process.env.AWS_KMS_ID
        this.awsEndpoint = config ? config.awsEndpoint || process.env.AWS_ENDPOINT_URL : process.env.AWS_ENDPOINT_URL
        this.secretName = parameters.secretName
        this.secretValue = parameters.secretValue
        this.SsmType = "SecureString"
        this.appName = parameters.appName || "ssmush"
        this.extraTags = parameters.extraTags || []

        this.generatePassword = parameters.generatePassword || false
        this.generatePasswordLength = config ? config.generatePasswordLength || Number(process.env.AWS_ENDPOINT_URL) : Number(process.env.AWS_ENDPOINT_URL) || 32
        this.overwriteUnmanaged = config ? config.overwriteUnmanaged || false : false

        this.client = new SSMClient({
            endpoint: this.awsEndpoint
        })

        this.secMgrClient = new SecretsManagerClient({
            endpoint: this.awsEndpoint
        })

    }
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

    public async isManaged() : Promise<boolean> {

        const resourceTags = await this.client.send(new ListTagsForResourceCommand({
            ResourceId: this.secretName,
            ResourceType: 'Parameter'
        }))

        if (resourceTags.TagList && resourceTags.TagList.length) {
            for (const existingTag of resourceTags.TagList) {
                if (existingTag.Key === 'ManagedBy' && existingTag.Value === this.appName) {

                    return true

                } else {
                    return false
                }
            }
        } else {
            return false
        }

        throw new Error("Cannot evaluate if parameter is managed");
        
    }

    public async createSecret(updateSecret?: boolean) : Promise<secretVersionOutput | undefined> {

        const secretValue = this.secretValue || await this.generateSecret()

        const managedTag: Tag = {Key: 'ManagedBy', Value: this.appName}
        // cannot overwrite a parameter and create tags
        const tags = updateSecret ? undefined : this.extraTags.concat(managedTag)

        const command = new PutParameterCommand({
            Name: this.secretName,
            Value: secretValue,
            Type: this.SsmType,
            KeyId: this.KmsKeyId,
            Overwrite: updateSecret,
            Tags: tags
        })

        try {
            const results: PutParameterCommandOutput = await this.client.send(command)
            
            return {"version": results.Version}

        } catch (error: any) {            
            if (error.name === 'ParameterAlreadyExists') {

                // Evaluate if parameter is tagged and managed by ssmush
                if (await this.isManaged() || this.overwriteUnmanaged) {

                    const newResult = await this.createSecret(updateSecret=true)
                
                    return newResult
                    
                } else {
                    throw new Error("Cannot overwrite existing unmanaged parameters. \
                    Please create a parameter with a new name or \
                    contact an administrator.")
                }

            } else {
                console.log(error)
                throw new Error("There was a problem submitting the parameter")
            }
        }

    }

}

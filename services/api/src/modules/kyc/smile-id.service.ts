import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebApi, JOB_TYPE, IMAGE_TYPE, Signature } from 'smile-identity-core';

@Injectable()
export class SmileIDService {
    private readonly logger = new Logger(SmileIDService.name);
    private webApi: WebApi;
    private signature: Signature;

    constructor(private configService: ConfigService) {
        const partnerId = this.configService.get<string>('SMILE_ID_PARTNER_ID');
        const apiKey = this.configService.get<string>('SMILE_ID_API_KEY');
        const callbackUrl = this.configService.get<string>('SMILE_ID_CALLBACK_URL');
        const env = this.configService.get<string>('SMILE_ID_ENVIRONMENT', 'sandbox');

        // sid_server: 0 for staging/sandbox, 1 for production
        const sidServer = env.toLowerCase() === 'production' ? 1 : 0;

        if (!partnerId || !apiKey) {
            this.logger.warn('Smile ID Partner ID or API Key missing. KYC verification will be limited.');
        } else {
            this.webApi = new WebApi(partnerId, callbackUrl, apiKey, sidServer);
            this.signature = new Signature(partnerId, apiKey);
        }
    }

    /**
     * Submit a KYC job to Smile ID (Document Verification)
     */
    async submitKYCJob(userId: string, data: {
        ghanaCardNumber: string;
        cardFrontBase64: string;
        cardBackBase64: string;
        selfieBase64: string;
    }) {
        if (!this.webApi) {
            throw new BadRequestException('Smile ID service is not configured.');
        }

        const jobId = `kyc-${userId}-${Date.now()}`;

        const partnerParams = {
            user_id: userId,
            job_id: jobId,
            job_type: JOB_TYPE.DOCUMENT_VERIFICATION,
        };

        const imageDetails = [
            {
                image_type_id: IMAGE_TYPE.SELFIE_IMAGE_BASE64,
                image: data.selfieBase64,
            },
            {
                image_type_id: IMAGE_TYPE.ID_CARD_IMAGE_BASE64,
                image: data.cardFrontBase64,
            },
            {
                image_type_id: IMAGE_TYPE.ID_CARD_BACK_IMAGE_BASE64,
                image: data.cardBackBase64,
            }
        ];

        const idInfo = {
            country: 'GH',
            id_type: 'GHANA_CARD',
            id_number: data.ghanaCardNumber,
            entered: true,
        };

        const options = {
            return_job_status: true,
            return_history: true,
            return_images: false,
        };

        try {
            this.logger.log(`Submitting Smile ID job ${jobId} for user ${userId}`);
            const response = await this.webApi.submit_job(partnerParams, imageDetails, idInfo, options);
            return {
                jobId,
                ...response,
            };
        } catch (error) {
            this.logger.error(`Smile ID job submission failed: ${error.message}`, error.stack);
            throw new BadRequestException(`Verification service error: ${error.message}`);
        }
    }

    /**
     * Get job status from Smile ID
     */
    async getJobStatus(userId: string, jobId: string, jobType: number = JOB_TYPE.DOCUMENT_VERIFICATION) {
        if (!this.webApi) return null;

        try {
            const partnerParams = {
                user_id: userId,
                job_id: jobId,
                job_type: jobType,
            };

            const options = {
                return_history: true,
                return_images: false,
            };

            return await this.webApi.get_job_status(partnerParams, options);
        } catch (error) {
            this.logger.error(`Failed to get Smile ID job status: ${error.message}`);
            return null;
        }
    }

    /**
     * Process webhook data from Smile ID
     */
    async processWebhook(data: any) {
        this.logger.log(`Received Smile ID webhook for user ${data.user_id}, job ${data.job_id}`);

        // Validate result
        const resultText = data.ResultText;
        const resultCode = data.ResultCode;

        return {
            userId: data.user_id,
            jobId: data.job_id,
            passed: ['0812', '0810', '1012'].includes(resultCode), // Various success codes
            resultText,
            resultCode,
            raw: data,
        };
    }

    /**
     * Verify Smile ID webhook signature
     */
    verifySignature(timestamp: string, signature: string): boolean {
        if (!this.signature) return false;
        return this.signature.confirm_signature(timestamp, signature);
    }
}

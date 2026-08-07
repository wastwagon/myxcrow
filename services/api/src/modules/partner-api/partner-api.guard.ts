import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService, type AuthenticatedPlatformKey } from '../api-keys/api-keys.service';

export type PartnerRequest = {
  partnerAuth?: AuthenticatedPlatformKey;
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class PartnerApiGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PartnerRequest>();
    const header = req.headers['authorization'] || req.headers['Authorization'];
    const rawHeader = Array.isArray(header) ? header[0] : header;
    const xKey = req.headers['x-myxcrow-key'];
    const rawKey = Array.isArray(xKey) ? xKey[0] : xKey;

    let token: string | undefined;
    if (rawHeader?.startsWith('Bearer ')) {
      token = rawHeader.slice(7).trim();
    } else if (rawKey) {
      token = String(rawKey).trim();
    }

    if (!token) {
      throw new UnauthorizedException('Missing MYXCROW API key (Authorization: Bearer mx_…)');
    }

    const auth = await this.apiKeys.authenticateBearer(token);
    if (!auth) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    req.partnerAuth = auth;
    return true;
  }
}

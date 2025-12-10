import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export type RuleTrigger =
  | { type: 'escrow_created' }
  | { type: 'escrow_status_changed'; fromStatus?: string; toStatus?: string }
  | { type: 'escrow_unfunded_days'; days: number }
  | { type: 'delivery_window_request'; approved: boolean }
  | { type: 'user_risk_score'; threshold: number; operator: 'gt' | 'lt' | 'eq' }
  | { type: 'wallet_balance'; threshold: number; operator: 'gt' | 'lt' | 'eq' }
  | { type: 'scheduled'; cron: string };

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: any;
}

export type RuleAction =
  | { type: 'cancel_escrow'; escrowId?: string }
  | { type: 'flag_user'; userId?: string; reason: string }
  | { type: 'send_notification'; channel: 'email' | 'sms' | 'push'; template: string; recipients: string[] }
  | { type: 'extend_delivery_window'; escrowId?: string; days: number }
  | { type: 'create_audit_log'; action: string; details: any }
  | { type: 'route_to_manual_review'; reason: string };

@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);
  private rules: AutomationRule[] = [];

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EscrowService))
    private escrowService: EscrowService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  /**
   * Load all enabled rules from database
   */
  async loadRules() {
    // In a real implementation, load from database
    // For now, we'll use in-memory rules that can be configured via settings
    this.rules = await this.getRulesFromSettings();
    this.logger.log(`Loaded ${this.rules.length} automation rules`);
  }

  /**
   * Evaluate rules for a given trigger event
   */
  async evaluateRules(trigger: RuleTrigger, context: any) {
    const matchingRules = this.rules.filter(
      (rule) => rule.enabled && this.matchesTrigger(rule.trigger, trigger),
    );

    for (const rule of matchingRules.sort((a, b) => b.priority - a.priority)) {
      if (await this.evaluateConditions(rule.conditions, context)) {
        await this.executeActions(rule.actions, context, rule);
      }
    }
  }

  /**
   * Check if a rule trigger matches the event
   */
  private matchesTrigger(ruleTrigger: RuleTrigger, eventTrigger: RuleTrigger): boolean {
    if (ruleTrigger.type !== eventTrigger.type) {
      return false;
    }

    switch (ruleTrigger.type) {
      case 'escrow_status_changed':
        const ruleStatus = ruleTrigger as any;
        const eventStatus = eventTrigger as any;
        if (ruleStatus.fromStatus && ruleStatus.fromStatus !== eventStatus.fromStatus) {
          return false;
        }
        if (ruleStatus.toStatus && ruleStatus.toStatus !== eventStatus.toStatus) {
          return false;
        }
        return true;
      case 'escrow_unfunded_days':
        return (ruleTrigger as any).days === (eventTrigger as any).days;
      case 'user_risk_score':
      case 'wallet_balance':
        return true; // Conditions will be evaluated separately
      default:
        return true;
    }
  }

  /**
   * Evaluate rule conditions against context
   */
  private async evaluateConditions(conditions: RuleCondition[], context: any): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(context, condition.field);
      if (!this.evaluateCondition(condition, fieldValue)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get field value from context (supports nested fields)
   */
  private getFieldValue(context: any, field: string): any {
    const parts = field.split('.');
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'gte':
        return Number(fieldValue) >= Number(condition.value);
      case 'lte':
        return Number(fieldValue) <= Number(condition.value);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Execute rule actions
   */
  private async executeActions(actions: RuleAction[], context: any, rule: AutomationRule) {
    for (const action of actions) {
      try {
        await this.executeAction(action, context, rule);
      } catch (error: any) {
        this.logger.error(`Failed to execute action ${action.type} for rule ${rule.id}: ${error.message}`);
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: RuleAction, context: any, rule: AutomationRule) {
    switch (action.type) {
      case 'cancel_escrow':
        const escrowId = action.escrowId || context.escrowId;
        if (escrowId) {
          await this.escrowService.cancelEscrow(escrowId, 'system');
          this.logger.log(`Rule ${rule.id}: Cancelled escrow ${escrowId}`);
        }
        break;

      case 'flag_user':
        const userId = action.userId || context.userId;
        if (userId) {
          await this.prisma.riskEvent.create({
            data: {
              userId,
              type: 'automated_flag',
              severity: 'medium',
              details: { reason: action.reason, ruleId: rule.id },
            },
          });
          this.logger.log(`Rule ${rule.id}: Flagged user ${userId}`);
        }
        break;

      case 'send_notification':
        if (action.channel === 'email') {
          for (const recipient of action.recipients) {
            await this.emailService.sendEmail(
              recipient,
              `Automation: ${rule.name}`,
              this.renderTemplate(action.template, context),
            );
          }
        }
        // SMS and push notifications would be implemented here
        break;

      case 'extend_delivery_window':
        const escrowIdForExtension = action.escrowId || context.escrowId;
        if (escrowIdForExtension) {
          // Implementation would extend the delivery window
          this.logger.log(`Rule ${rule.id}: Extended delivery window for escrow ${escrowIdForExtension}`);
        }
        break;

      case 'create_audit_log':
        await this.auditService.log({
          userId: context.userId || 'system',
          action: action.action,
          resource: context.resource || 'automation',
          resourceId: context.resourceId,
          details: { ...action.details, ruleId: rule.id },
        });
        break;

      case 'route_to_manual_review':
        // Implementation would create a review task
        this.logger.log(`Rule ${rule.id}: Routed to manual review: ${action.reason}`);
        break;
    }
  }

  /**
   * Render notification template with context variables
   */
  private renderTemplate(template: string, context: any): string {
    let rendered = template;
    for (const [key, value] of Object.entries(context)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return rendered;
  }

  /**
   * Get rules from platform settings (for now, can be moved to dedicated table later)
   */
  private async getRulesFromSettings(): Promise<AutomationRule[]> {
    // Default rules that can be configured
    const defaultRules: AutomationRule[] = [
      {
        id: 'auto-cancel-unfunded',
        name: 'Auto-Cancel Unfunded Escrows',
        description: 'Cancel escrows that remain unfunded for 7 days',
        enabled: true,
        trigger: { type: 'escrow_unfunded_days', days: 7 },
        conditions: [
          { field: 'status', operator: 'eq', value: 'AWAITING_FUNDING' },
        ],
        actions: [
          { type: 'cancel_escrow' },
          {
            type: 'send_notification',
            channel: 'email',
            template: 'Your escrow {{escrowId}} has been cancelled due to lack of funding.',
            recipients: ['{{buyerEmail}}', '{{sellerEmail}}'],
          },
        ],
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // In production, load from database or settings
    return defaultRules;
  }

  /**
   * Create or update a rule
   */
  async createOrUpdateRule(rule: Partial<AutomationRule>): Promise<AutomationRule> {
    // In production, save to database
    // For now, update in-memory rules
    const existingIndex = this.rules.findIndex((r) => r.id === rule.id);
    const newRule = {
      ...rule,
      id: rule.id || `rule-${Date.now()}`,
      createdAt: rule.createdAt || new Date(),
      updatedAt: new Date(),
    } as AutomationRule;

    if (existingIndex >= 0) {
      this.rules[existingIndex] = newRule;
    } else {
      this.rules.push(newRule);
    }

    return newRule;
  }

  /**
   * Get all rules
   */
  async getRules(): Promise<AutomationRule[]> {
    return this.rules;
  }
}


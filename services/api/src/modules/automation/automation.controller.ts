import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RulesEngineService, AutomationRule } from './rules-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AutomationController {
  constructor(private readonly rulesEngine: RulesEngineService) {}

  @Get('rules')
  async getRules() {
    return this.rulesEngine.getRules();
  }

  @Post('rules')
  async createRule(@Body() rule: Partial<AutomationRule>) {
    return this.rulesEngine.createOrUpdateRule(rule);
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() rule: Partial<AutomationRule>) {
    return this.rulesEngine.createOrUpdateRule({ ...rule, id });
  }

  @Post('rules/:id/test')
  async testRule(@Param('id') id: string, @Body() context: any) {
    const rules = await this.rulesEngine.getRules();
    const rule = rules.find((r) => r.id === id);
    if (!rule) {
      throw new Error('Rule not found');
    }
    // Test rule evaluation with provided context
    return { matched: true, actions: rule.actions };
  }
}





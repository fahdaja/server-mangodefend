import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { SubscriptionService } from '../service/subscription.service';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../users/enum/roles.enum';

@Controller('subscriptions')
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @Get('active/:userId')
    async getActiveSubscriptions(@Param('userId', ParseIntPipe) userId: number) {
        return this.subscriptionService.findAllActiveSubscription(userId);
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @Get('all')
    async getAllSubscriptions() {
        return this.subscriptionService.findAllSubscriptionsWithUser();
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @Post('plan')
    async createPlan(@Body() createPlanDto: CreatePlanDto, @Request() req) {
        createPlanDto.user_id = req.user.id;
        return this.subscriptionService.createPlan(createPlanDto);
    }

    @Get('plan')
    async getAllPlans() {
        return this.subscriptionService.findAllPlans();
    }
}

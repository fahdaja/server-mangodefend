import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transactions } from './entity/transactions.entity';
import { Plans, Subscriptions } from '../subscriptions/entity/subscription.entity';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionService } from '../subscriptions/service/subscription.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Transactions, Plans, Subscriptions]),
        AuthModule
    ],
    controllers: [TransactionController],
    providers: [TransactionService, SubscriptionService],
    exports: [TransactionService]
})
export class TransactionModule {}

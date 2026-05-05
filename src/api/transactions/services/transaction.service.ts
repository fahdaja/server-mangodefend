import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transactions } from "../entity/transactions.entity";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { TransactionStatus } from "../enum/transaction.enum";
import { Plans } from "../../subscriptions/entity/subscription.entity";
import { SubscriptionService } from "../../subscriptions/service/subscription.service";

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(Transactions)
        private transactionRepository: Repository<Transactions>,
        @InjectRepository(Plans)
        private planRepository: Repository<Plans>,
        private subscriptionService: SubscriptionService
    ) {}

    async createTransaction(data: CreateTransactionDto): Promise<any> {
        // Cek apakah plan valid
        const plan = await this.planRepository.findOne({ where: { id: data.plan_id } });
        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        // Buat record transaksi dengan status PENDING
        const transaction = this.transactionRepository.create({
            user_id: data.user_id,
            plan_id: data.plan_id,
            amount: plan.price,
            method: data.method,
            status: TransactionStatus.PENDING
        });

        const savedTransaction = await this.transactionRepository.save(transaction);
        
        return {
            status: 'success',
            message: 'Transaction created successfully. Please complete the payment.',
            data: savedTransaction
        };
    }

    // Simulasi Webhook dari Midtrans/Payment Gateway
    async simulatePaymentSuccess(transactionId: number): Promise<any> {
        const transaction = await this.transactionRepository.findOne({ where: { id: transactionId } });
        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (transaction.status === TransactionStatus.SUCCESS) {
            throw new BadRequestException('Transaction already paid');
        }

        // Ubah status jadi SUCCESS
        transaction.status = TransactionStatus.SUCCESS;
        await this.transactionRepository.save(transaction);

        // Panggil service subscription untuk aktivasi paket
        await this.subscriptionService.createSubscription({
            user_id: transaction.user_id,
            plan_id: transaction.plan_id
        });

        return {
            status: 'success',
            message: 'Payment successful, subscription activated!',
            data: transaction
        };
    }
}

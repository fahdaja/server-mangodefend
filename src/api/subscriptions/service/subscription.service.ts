import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Plans, Subscriptions } from "../entity/subscription.entity";
import { CreatePlanDto } from "../dto/create-plan.dto";
import { CreateSubscriptionDto } from "../dto/create-subscription.dto";

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(Subscriptions)
        private subscriptionRepository: Repository<Subscriptions>,
        @InjectRepository(Plans)
        private planRepository: Repository<Plans>
    ) {}

    // tampilkan list subscription yang aktif
    async findAllActiveSubscription(userId: number): Promise<Subscriptions[]> {
        return await this.subscriptionRepository.find({
            where: { user_id: userId, is_active: true },
            relations: ['plan', 'plan.model']
        });
    }

    // tampilkan list subscription berikut user yang
    async findAllSubscriptionsWithUser(): Promise<Subscriptions[]> {
        return await this.subscriptionRepository.find({
            relations: ['user', 'plan', 'plan.model']
        });
    }

    // admin buat card plan dari setiap subscription
    async createPlan(data: CreatePlanDto): Promise<any> {
        const plan = this.planRepository.create(data);
        const savedPlan = await this.planRepository.save(plan);
        return {
            status: 'success',
            message: 'Plan created successfully',
            data: savedPlan
        };
    }

    async findAllPlans(): Promise<Plans[]> {
        return await this.planRepository.find({
            relations: ['model']
        });
    }

    // buat data user yang melakukan subscription berdasarkan plan yang dipilih
    // lalu arahkan ke transaction
    async createSubscription(data: CreateSubscriptionDto): Promise<Subscriptions> {
        const plan = await this.planRepository.findOne({ where: { id: data.plan_id } });
        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        // Cari apakah user sudah punya subscription yang masih aktif (diambil yang tenggat waktunya paling lama)
        const existingSubscription = await this.subscriptionRepository.findOne({
            where: { user_id: data.user_id, is_active: true },
            order: { end_date: 'DESC' }
        });

        if (existingSubscription && existingSubscription.end_date > new Date()) {
            if (existingSubscription.plan_id !== data.plan_id) {
                // LOGIKA OVERRIDE: User mengganti plan (misal Free ke Pro)
                // Matikan langganan yang lama
                existingSubscription.is_active = false;
                await this.subscriptionRepository.save(existingSubscription);

                // Buat langganan baru yang langsung aktif hari ini
                const end_date = new Date();
                end_date.setDate(end_date.getDate() + plan.durationDays);

                const newSubscription = this.subscriptionRepository.create({
                    user_id: data.user_id,
                    plan_id: data.plan_id,
                    start_date: new Date(),
                    end_date: end_date,
                    is_active: true
                });

                return await this.subscriptionRepository.save(newSubscription);
            }

            // LOGIKA RENEWAL: User membeli plan yang SAMA
            // Tambahkan durasi ke end_date yang sudah ada
            const newEndDate = new Date(existingSubscription.end_date);
            newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
            
            existingSubscription.end_date = newEndDate;
            return await this.subscriptionRepository.save(existingSubscription);

        } else {
            // Jika belum ada langganan atau sudah kedaluwarsa, buat baru
            const end_date = new Date();
            end_date.setDate(end_date.getDate() + plan.durationDays);

            const subscription = this.subscriptionRepository.create({
                user_id: data.user_id,
                plan_id: data.plan_id,
                start_date: new Date(),
                end_date: end_date,
                is_active: true
            });

            return await this.subscriptionRepository.save(subscription);
        }
    }
}
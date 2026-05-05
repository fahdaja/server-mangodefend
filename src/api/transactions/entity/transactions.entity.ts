import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { TransactionStatus } from "../enum/transaction.enum"
import { Method } from "../enum/method.enum"

@Entity()
export class Transactions {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    user_id!: number

    @Column()
    plan_id!: number

    @Column({ nullable: true })
    external_id?: string

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number

    @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
    status!: TransactionStatus

    @Column({ type: 'enum', enum: Method, nullable: true })
    method!: Method

    @CreateDateColumn()
    created_at!: Date
    
    @UpdateDateColumn()
    update_at!: Date
}
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { PlanType } from "../enum/plan.enum";

export class CreatePlanDto {
    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsNotEmpty()
    @IsEnum(PlanType)
    plan_name!: PlanType;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsNotEmpty()
    @IsNumber()
    durationDays!: number;

    @IsOptional()
    @IsNumber()
    model_id?: number;
}

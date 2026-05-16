import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MlModel } from "../entity/ml.entity";
import { CreateMlModelDto } from "../dto/create-ml.dto";

@Injectable()
export class MlService {
    constructor(
        @InjectRepository(MlModel)
        private mlModelRepository: Repository<MlModel>
    ) {}
    
    async createModel(data: CreateMlModelDto): Promise<any> {
        const existingModel = await this.mlModelRepository.findOne({ where: { version: data.version } });
        if (existingModel) {
            throw new ConflictException(`Model with version ${data.version} already exists`);
        }

        const model = this.mlModelRepository.create(data);
        const savedModel = await this.mlModelRepository.save(model);

        return {
            status: 'success',
            message: 'Model created successfully',
            data: savedModel
        };
    }

    async findAllModels(): Promise<any> {
        const models = await this.mlModelRepository.find({ order: { created_at: 'DESC' } });
        return {
            status: 'success',
            data: models
        };
    }

    async toggleModelStatus(id: number, is_active: boolean): Promise<any> {
        const model = await this.mlModelRepository.findOne({ where: { id } });
        if (!model) {
            throw new NotFoundException('Model not found');
        }
        if(is_active){
            await this.mlModelRepository.update({},{is_active: false});
        }

        model.is_active = is_active;
        await this.mlModelRepository.save(model);

        return {
            status: 'success',
            message: `Model status updated to ${is_active ? 'active' : 'inactive'}`,
            data: model
        };
    }
    
    async deleteModel(id: number): Promise<any> {
        const model = await this.mlModelRepository.findOne({ where: { id } });
        if (!model) {
            throw new NotFoundException('Model not found');
        }

        await this.mlModelRepository.remove(model);

        return {
            status: 'success',
            message: 'Model deleted successfully',
            data: model
        };
    }
}

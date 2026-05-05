import { Controller, Get, Post, Body, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { MlService } from '../services/ml.service';
import { CreateMlModelDto } from '../dto/create-ml.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorator/roles.decorator';
import { Role } from '../../users/enum/roles.enum';

@Controller('models')
export class MlController {
    constructor(private readonly mlService: MlService) {}

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @Post()
    async createModel(@Body() createMlModelDto: CreateMlModelDto) {
        return this.mlService.createModel(createMlModelDto);
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @Get()
    async getAllModels() {
        return this.mlService.findAllModels();
    }

    @UseGuards(AuthGuard, RoleGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/status')
    async toggleModelStatus(@Param('id', ParseIntPipe) id: number, @Body('is_active') is_active: boolean) {
        return this.mlService.toggleModelStatus(id, is_active);
    }
}

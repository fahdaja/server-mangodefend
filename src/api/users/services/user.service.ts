  import { Injectable, BadRequestException, ConflictException, HttpStatus } from "@nestjs/common";
  import { InjectRepository } from "@nestjs/typeorm";
  import { User, Device } from "../entity/user.entity";
  import { Repository } from "typeorm";
  import { BcryptService } from "../../../common/hash/bcrypt.service";
  import { CreateUserDto } from "../dto/user.dto";
  import { application_type, os_type } from "../enum/devices.enum";


  @Injectable()
  export class UserService {
      constructor(
          @InjectRepository(User) private readonly userRepository: Repository<User>, 
          @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
          private readonly bcryptService: BcryptService
          ) {}

    async createUser(createUserDto: CreateUserDto,): Promise<User> {
        const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
        const newUser = this.userRepository.create(createUserDto);
        newUser.password = await this.bcryptService.hashPassword(createUserDto.password);
        return await this.userRepository.save(newUser);
      }
      
      async recordUserDevice(
      userId: number, 
      deviceData: { 
          hardware_id: string; 
          hostname: string; 
          os_type: os_type; 
          app_type: application_type, 
          last_login: Date | null,
          last_active: Date | null,
          is_active: boolean 
      }
  ): Promise<Device> {
      const existingDevice = await this.deviceRepository.findOne({ 
          where: { user_id: userId, hardware_id: deviceData.hardware_id } 
      });

      const now = new Date();

      if (existingDevice) {
          Object.assign(existingDevice, deviceData);

          if (deviceData.is_active === true) {
              existingDevice.last_login = now;
          } else {
              existingDevice.last_active = now;
          }

          return await this.deviceRepository.save(existingDevice);
      } else {
          const newDevice = this.deviceRepository.create({ 
              ...deviceData, 
              user_id: userId,
              last_login: now, 
              last_active: null 
          });
          return await this.deviceRepository.save(newDevice);
      }
  }

  async findAll() {
      return await this.userRepository.find({
        relations: ['devices', 'subscriptions', 'subscriptions.plan'],
        order: { createdAt: 'DESC' }
      });
    }

    async findDevice( userId: number, hardwareId: string): Promise<Device | null> {
      return await this.deviceRepository.findOne({ where: { user_id: userId, hardware_id: hardwareId } });
    }
    
    async findByEmail(email: string): Promise<User | null> {
      return await this.userRepository.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
      return await this.userRepository.findOne({ where: { id } });
    }
  }

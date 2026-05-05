import { BcryptService } from "../../../common/hash/bcrypt.service";
import { UserService } from "../../users/services/user.service";
import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { DeactivateDeviceDto, LoginDto, PayloadDto, SessionDevice, SignOutDto } from "../dto/auth.dto";
import { JwtService } from "@nestjs/jwt";
import { application_type, os_type } from "../../users/enum/devices.enum";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor( @Inject(forwardRef(() => UserService)) private readonly userService: UserService, private readonly bcryptService: BcryptService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

    async signIn(user: LoginDto, device: SessionDevice): Promise<any> {
        const { email, password } = user;
        const existingUser = await this.userService.findByEmail(email);
        if (!existingUser) {
            throw new UnauthorizedException('User not found');
        }
        const isPasswordValid = await this.bcryptService.comparePassword(password, existingUser.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }
        if (!device || !device.hardware_id || !device.os_type || !device.app_type) {
            throw new BadRequestException('Data device tidak lengkap. Harap sertakan object device dengan property: hardware_id, hostname, os_type, dan app_type');
        }

        try {
            await this.userService.recordUserDevice(existingUser.id, { 
                hardware_id: device.hardware_id, 
                hostname: device.hostname, 
                os_type: device.os_type, 
                app_type: device.app_type, 
                last_login: new Date(), 
                last_active: null, 
                is_active: true 
            });
        } catch (error: any) {
            throw new BadRequestException(`Gagal mencatat perangkat: ${error.message}`);
        }
        const token = await this.generateToken({
            id: existingUser.id, email: existingUser.email, role: existingUser.role
        })
        return {
            status: 'success',
            message: 'Login successful',
            data: {
                access_token: token.access_token,
                token_type: 'Bearer',
                expires_in: token.expires_in,
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    role: existingUser.role
                }
            }
        }
    }

    async signOut(signOutDto: SignOutDto): Promise<any> {
       const device = await this.userService.findDevice(signOutDto.user_id!,signOutDto.hardware_id);
       if (!device) {
        throw new BadRequestException('Device not found');
       }
       await this.userService.recordUserDevice(signOutDto.user_id!,  { ...device, last_active: new Date(), is_active: false });
       return {
            status: 'success',
            message: 'Successfully logged out and session terminated',
            data: null
       }
    } 

    async deactivateDevice(deactivateDeviceDto: DeactivateDeviceDto): Promise<void> {
        const {user_id, hardware_id } = deactivateDeviceDto;

        const device = await this.userService.findDevice(user_id, hardware_id);
        if (!device) {
            throw new BadRequestException('Device not found');
        }

        await this.userService.recordUserDevice(user_id,{
            hardware_id: device.hardware_id,
            hostname: '',
            os_type: os_type.UNKNOWN,
            app_type: application_type.UNKNOWN,
            last_active: null,
            last_login: null,
            is_active: false
        });
    }
    async generateToken(payload: PayloadDto): Promise<{ access_token: string, expires_in: number}> {
        const expiresIn = 86400;
        const secret = this.configService.get<string>('JWT_SECRET');
        const access_token = await this.jwtService.signAsync(payload, {
            secret: secret,
            expiresIn: `${expiresIn}s`
        });
        return {
            access_token,
            expires_in: expiresIn
        }
    }
}
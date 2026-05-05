import { BadRequestException, Body, Controller, HttpCode, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LoginDto, SessionDevice, SignOutDto } from "../dto/auth.dto";
import { AuthGuard } from "../guards/auth.guard";



@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("login")
    @HttpCode(200)
    async signIn(@Body() body: any) {
    const loginData: LoginDto = { email: body.email, password: body.password };
    const deviceData: SessionDevice = body.device;
        
    return this.authService.signIn(loginData, deviceData);
}

@Post("logout")
@UseGuards(AuthGuard)
    @HttpCode(200)
    async signOut(@Body() signOutDto: SignOutDto, @Req() req ){
        const userIdFromToken = req.user.id;

        return await this.authService.signOut({
            ...signOutDto,
            user_id : userIdFromToken
        })
    }
    
}



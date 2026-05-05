import { Controller, Post, Body, HttpCode, HttpStatus, HttpException, Get, UseGuards } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { CreateUserDto, UserResponseDto } from "../dto/user.dto";
import { AuthGuard } from "@nestjs/passport";
import { RoleGuard } from "src/api/auth/guards/roles.guard";
import { Roles } from "src/common/decorator/roles.decorator";
import { Role } from "../enum/roles.enum";


@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('/register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() createUserDto: CreateUserDto): Promise<{ message: string; data: UserResponseDto }> {
    try{
        
        const user = await this.userService.createUser(createUserDto);
        const response: UserResponseDto = {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        };
        return {
            message: "User registered successfully",
            data: response,
        };
    } catch(error){
        if (error instanceof HttpException){
            throw error;
        }
        throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
@UseGuards(AuthGuard, RoleGuard)
@Roles(Role.ADMIN)
@Get('/users')
async findAll() {
  const users = await this.userService.findAll();
  return { data: users };
}

}
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { application_type, os_type } from 'src/api/users/enum/devices.enum';

export class FirebaseLoginDto {
  @IsNotEmpty({ message: 'Firebase ID token is required' })
  @IsString()
  idToken!: string;

  @IsOptional()
  device?: FirebaseSessionDevice;
}

export class FirebaseSessionDevice {
  @IsNotEmpty()
  hardware_id!: string;

  @IsNotEmpty()
  hostname!: string;

  @IsNotEmpty()
  app_type!: application_type;

  @IsNotEmpty()
  os_type!: os_type;
}

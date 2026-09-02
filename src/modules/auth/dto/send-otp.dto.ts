import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Email hoặc số điện thoại nhận mã xác thực',
    example: 'user@lingoarena.com',
  })
  @IsNotEmpty({ message: 'Target không được để trống' })
  @IsString()
  target: string;

  @ApiProperty({
    description: 'Mục đích gửi mã (register, reset_password, verify_email)',
    example: 'reset_password',
  })
  @IsNotEmpty({ message: 'Mục đích không được để trống' })
  @IsString()
  purpose: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Email hoặc số điện thoại', example: 'user@lingoarena.com' })
  @IsNotEmpty({ message: 'Target không được để trống' })
  @IsString()
  target: string;

  @ApiProperty({ description: 'Mã xác thực 6 số', example: '123456' })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Mục đích xác thực', example: 'reset_password' })
  @IsNotEmpty({ message: 'Mục đích không được để trống' })
  @IsString()
  purpose: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email hoặc số điện thoại', example: 'user@lingoarena.com' })
  @IsNotEmpty()
  @IsString()
  target: string;

  @ApiProperty({ description: 'Mã xác thực 6 số', example: '123456' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Mật khẩu mới', example: 'NewPassword123@' })
  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  newPassword: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({
    description: 'Email, số điện thoại hoặc username',
    example: 'user@lingoarena.com',
  })
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Password123@' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'ID thiết bị' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Loại thiết bị (web, ios, android)', default: 'web' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Mã token reCAPTCHA' })
  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}

export class AdminLoginDto {
  @ApiProperty({ description: 'Email quản trị viên', example: 'admin@lingoarena.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Admin123@' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  password: string;
}

export class UserRegisterDto {
  @ApiProperty({ description: 'Email đăng ký', example: 'newuser@lingoarena.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Password123@' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ description: 'Họ và tên đầy đủ', example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Tên hiển thị công khai', example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Mã giới thiệu (nếu có)' })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional({ description: 'Mã OTP xác thực email (6 số)' })
  @IsOptional()
  @IsString()
  otpCode?: string;

  @ApiPropertyOptional({ description: 'Phương thức gửi OTP (EMAIL | SMS)', default: 'EMAIL' })
  @IsOptional()
  @IsString()
  sendMethod?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh Token' })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  @IsString()
  refreshToken: string;

  @ApiPropertyOptional({ description: 'ID thiết bị' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'ID Token từ Google OAuth' })
  @IsNotEmpty({ message: 'Google ID Token không được để trống' })
  @IsString()
  idToken: string;

  @ApiPropertyOptional({ description: 'ID thiết bị' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Loại thiết bị', default: 'web' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class FacebookLoginDto {
  @ApiProperty({ description: 'Access Token từ Facebook OAuth / SDK' })
  @IsNotEmpty({ message: 'Facebook Access Token không được để trống' })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({ description: 'ID thiết bị' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Loại thiết bị', default: 'web' })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

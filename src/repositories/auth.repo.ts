import {
  OauthAccountEntity,
  OrganizationEntity,
  OrganizationMemberEntity,
  PermissionEntity,
  RefreshTokenEntity,
  RoleEntity,
  RolePermissionEntity,
  UserDeviceEntity,
  UserEntity,
  UserProfileEntity,
  UserRoleEntity,
  UserSessionEntity,
  VerificationCodeEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(UserEntity)
export class UserRepo extends PrimaryRepo<UserEntity> {}

@CustomRepository(UserProfileEntity)
export class UserProfileRepo extends PrimaryRepo<UserProfileEntity> {}

@CustomRepository(RoleEntity)
export class RoleRepo extends PrimaryRepo<RoleEntity> {}

@CustomRepository(PermissionEntity)
export class PermissionRepo extends PrimaryRepo<PermissionEntity> {}

@CustomRepository(UserRoleEntity)
export class UserRoleRepo extends PrimaryRepo<UserRoleEntity> {}

@CustomRepository(RolePermissionEntity)
export class RolePermissionRepo extends PrimaryRepo<RolePermissionEntity> {}

@CustomRepository(UserSessionEntity)
export class UserSessionRepo extends PrimaryRepo<UserSessionEntity> {}

@CustomRepository(RefreshTokenEntity)
export class RefreshTokenRepo extends PrimaryRepo<RefreshTokenEntity> {}

@CustomRepository(OauthAccountEntity)
export class OauthAccountRepo extends PrimaryRepo<OauthAccountEntity> {}

@CustomRepository(UserDeviceEntity)
export class UserDeviceRepo extends PrimaryRepo<UserDeviceEntity> {}

@CustomRepository(OrganizationEntity)
export class OrganizationRepo extends PrimaryRepo<OrganizationEntity> {}

@CustomRepository(OrganizationMemberEntity)
export class OrganizationMemberRepo extends PrimaryRepo<OrganizationMemberEntity> {}

@CustomRepository(VerificationCodeEntity)
export class VerificationCodeRepo extends PrimaryRepo<VerificationCodeEntity> {}

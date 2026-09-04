import {
  OauthAccountEntity,
  RoleEntity,
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

@CustomRepository(UserRoleEntity)
export class UserRoleRepo extends PrimaryRepo<UserRoleEntity> {}

@CustomRepository(UserSessionEntity)
export class UserSessionRepo extends PrimaryRepo<UserSessionEntity> {}

@CustomRepository(OauthAccountEntity)
export class OauthAccountRepo extends PrimaryRepo<OauthAccountEntity> {}

@CustomRepository(VerificationCodeEntity)
export class VerificationCodeRepo extends PrimaryRepo<VerificationCodeEntity> {}

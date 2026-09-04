import { OrganizationEntity, OrganizationMemberEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(OrganizationEntity)
export class OrganizationRepo extends PrimaryRepo<OrganizationEntity> {}

@CustomRepository(OrganizationMemberEntity)
export class OrganizationMemberRepo extends PrimaryRepo<OrganizationMemberEntity> {}

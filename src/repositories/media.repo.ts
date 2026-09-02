import { MediaAssetEntity, MediaVariantEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(MediaAssetEntity)
export class MediaAssetRepo extends PrimaryRepo<MediaAssetEntity> {}

@CustomRepository(MediaVariantEntity)
export class MediaVariantRepo extends PrimaryRepo<MediaVariantEntity> {}

import { MediaAssetEntity, MediaAttachmentEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(MediaAssetEntity)
export class MediaAssetRepo extends PrimaryRepo<MediaAssetEntity> {}

@CustomRepository(MediaAttachmentEntity)
export class MediaAttachmentRepo extends PrimaryRepo<MediaAttachmentEntity> {}

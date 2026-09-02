import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { enumData } from '~/common/enums/base.enum';
import { PrimaryBaseEntity } from '../base.entity';
import { ExamSkillEntity } from '../exam/exam-skill.entity';
import { TopicEntity } from '../question/topic.entity';
import { ArenaMatchParticipantEntity } from './arena-match-participant.entity';
import { ArenaMatchQuestionEntity } from './arena-match-question.entity';
import { ArenaSeasonEntity } from './arena-season.entity';

@Entity('arena_matches')
@Index('idx_arena_matches_skill_id', ['examSkillId'])
@Index('idx_arena_matches_status', ['status'])
@Index('idx_arena_matches_season_id', ['seasonId'])
export class ArenaMatchEntity extends PrimaryBaseEntity {
  @ApiProperty({ description: 'Khóa ngoại tham chiếu đến kỹ năng kỳ thi' })
  @Column({ type: 'uuid' })
  examSkillId: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến chủ đề' })
  @Column({ type: 'uuid', nullable: true })
  topicId?: string;

  @ApiPropertyOptional({ description: 'Khóa ngoại tham chiếu đến mùa đấu' })
  @Column({ type: 'uuid', nullable: true })
  seasonId?: string;

  @ApiProperty({
    enum: enumData.ARENA_MATCH_MODE,
    default: enumData.ARENA_MATCH_MODE.RANKED.code,
    description: 'Chế độ trận đấu',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_MATCH_MODE.RANKED.code })
  matchMode: string;

  @ApiProperty({ description: 'Số lượng người chơi tối đa', default: 2 })
  @Column({ type: 'int', default: 2 })
  maxPlayers: number;

  @ApiProperty({ description: 'Số lượng câu hỏi trong trận', default: 10 })
  @Column({ type: 'int', default: 10 })
  questionCount: number;

  @ApiProperty({ description: 'Thời lượng trận đấu (giây)', default: 0 })
  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @ApiProperty({
    enum: enumData.ARENA_MATCH_STATUS,
    default: enumData.ARENA_MATCH_STATUS.WAITING.code,
    description: 'Trạng thái trận đấu',
  })
  @Column({ type: 'varchar', length: 20, default: enumData.ARENA_MATCH_STATUS.WAITING.code })
  status: string;

  @ApiPropertyOptional({ description: 'Thời điểm bắt đầu trận đấu' })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Thời điểm kết thúc trận đấu' })
  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @ApiPropertyOptional({ description: 'Cấu hình trận đấu dạng JSON' })
  @Column({ type: 'jsonb', nullable: true })
  matchConfigJson?: Record<string, unknown>;

  @ManyToOne(() => ExamSkillEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examSkillId' })
  examSkill?: ExamSkillEntity;

  @ManyToOne(() => TopicEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'topicId' })
  topic?: TopicEntity;

  @ManyToOne(() => ArenaSeasonEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'seasonId' })
  season?: ArenaSeasonEntity;

  @OneToMany(() => ArenaMatchQuestionEntity, mq => mq.match)
  matchQuestions?: ArenaMatchQuestionEntity[];

  @OneToMany(() => ArenaMatchParticipantEntity, mp => mp.match)
  participants?: ArenaMatchParticipantEntity[];
}

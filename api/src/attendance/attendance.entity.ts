import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AttendanceType = 'check-in' | 'check-out';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  userName!: string;

  @Column()
  type!: AttendanceType;

  @Column({ type: 'real', nullable: true })
  faceConfidence!: number | null;

  @Column({ type: 'real', nullable: true })
  latitude!: number | null;

  @Column({ type: 'real', nullable: true })
  longitude!: number | null;

  @Column({ type: 'real', nullable: true })
  distance!: number | null;

  @CreateDateColumn()
  timestamp!: Date;
}

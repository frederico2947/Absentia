import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ default: 'employee' })
  role!: string;

  @Column({ type: 'text', nullable: true })
  faceDescriptors!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

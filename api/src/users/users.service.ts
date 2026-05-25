import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

type CreateUserInput = {
  email: string;
  password: string;
  name: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create(input);
    return this.usersRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async saveFaceDescriptors(userId: string, descriptors: number[][]): Promise<void> {
    await this.usersRepository.update(userId, {
      faceDescriptors: JSON.stringify(descriptors),
    });
  }

  async getAllWithFaceDescriptors(): Promise<{ id: string; name: string; descriptors: number[][] }[]> {
    const users = await this.usersRepository.find({
      select: ['id', 'name', 'faceDescriptors'],
    });
    return users
      .filter((u) => u.faceDescriptors)
      .map((u) => ({
        id: u.id,
        name: u.name,
        descriptors: JSON.parse(u.faceDescriptors!) as number[][],
      }));
  }

  async getFaceDescriptors(userId: string): Promise<number[][] | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['faceDescriptors'],
    });
    if (!user?.faceDescriptors) return null;
    return JSON.parse(user.faceDescriptors) as number[][];
  }
}

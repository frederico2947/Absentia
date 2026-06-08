import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

  async adminCreate(input: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<{ id: string; name: string; email: string; role: string }> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const hashed = await bcrypt.hash(input.password, 10);
    const user = this.usersRepository.create({
      name: input.name,
      email: input.email,
      password: hashed,
      role: input.role ?? 'employee',
    });
    const saved = await this.usersRepository.save(user);
    return { id: saved.id, name: saved.name, email: saved.email, role: saved.role };
  }

  async adminUpdate(
    id: string,
    input: { name?: string; role?: string },
  ): Promise<{ id: string; name: string; email: string; role: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (input.name !== undefined) user.name = input.name;
    if (input.role !== undefined) user.role = input.role;
    const saved = await this.usersRepository.save(user);
    return { id: saved.id, name: saved.name, email: saved.email, role: saved.role };
  }

  async adminDelete(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
  }

  async findAdmins(): Promise<{ id: string; name: string; email: string; role: string }[]> {
    return this.usersRepository.find({
      where: { role: 'admin' },
      select: ['id', 'name', 'email', 'role'],
    });
  }

  async findAll(): Promise<{ id: string; name: string; email: string; role: string }[]> {
    return this.usersRepository.find({
      select: ['id', 'name', 'email', 'role'],
      order: { name: 'ASC' },
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

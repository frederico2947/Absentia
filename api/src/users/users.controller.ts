import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type AuthenticatedRequest = Request & {
  user: { id: string; email: string; name: string; role: string };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest): Promise<{ id: string; name: string; email: string; role: string }[]> {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
    return this.usersService.findAll();
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateUserDto,
  ): Promise<{ id: string; name: string; email: string; role: string }> {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
    return this.usersService.adminCreate(dto);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<{ id: string; name: string; email: string; role: string }> {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
    return this.usersService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin only');
    }
    if (req.user.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    return this.usersService.adminDelete(id);
  }

  @Put('me/face-descriptors')
  async saveFaceDescriptors(
    @Req() req: AuthenticatedRequest,
    @Body() body: { descriptors: number[][] },
  ): Promise<{ success: boolean }> {
    await this.usersService.saveFaceDescriptors(req.user.id, body.descriptors);
    return { success: true };
  }

  @Get('face-descriptors')
  getAllFaceDescriptors(): Promise<{ id: string; name: string; descriptors: number[][] }[]> {
    return this.usersService.getAllWithFaceDescriptors();
  }
}


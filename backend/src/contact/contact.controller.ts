import { MaxLength } from 'class-validator';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { ContactService } from './contact.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

class CreateContactMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message: string;
}

class UpdateStatusDto {
  @IsIn(['NEW', 'READ', 'RESOLVED'])
  status: string;
}

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('contact')
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.create(dto.name, dto.phone, dto.email, dto.message);
  }

  @Get('admin/contact-messages')
  @UseGuards(AdminAuthGuard)
  findAll() {
    return this.contactService.findAll();
  }

  @Patch('admin/contact-messages/:id/status')
  @UseGuards(AdminAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.contactService.updateStatus(id, dto.status);
  }
}

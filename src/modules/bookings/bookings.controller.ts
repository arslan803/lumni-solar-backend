import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Roles('customer')
  @Get()
  findMine(@Req() req: any) {
    return this.bookings.findByCustomer(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.bookings.findOne(id, req.user.id, req.user.role);
  }

  @Roles('customer')
  @Post(':id/milestones/:milestoneId/confirm')
  confirmMilestone(
    @Req() req: any,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.bookings.confirmMilestone(id, milestoneId, req.user.id);
  }

  @Roles('installer')
  @Post(':id/installation-record')
  createRecord(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { panelSerials: string[]; inverterSerial: string; designDocUrl?: string },
  ) {
    return this.bookings.createInstallationRecord(id, req.user.id, body);
  }
}

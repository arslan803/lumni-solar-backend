import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { InstallerTier } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('installers/pending')
  pendingInstallers() {
    return this.admin.getPendingInstallers();
  }

  @Patch('installers/:id/verify')
  verifyInstaller(
    @Param('id') id: string,
    @Body('tier') tier: InstallerTier,
  ) {
    return this.admin.verifyInstaller(id, tier || 'basic');
  }

  @Get('dashboard/metrics')
  metrics() {
    return this.admin.getMetrics();
  }

  @Get('bookings')
  bookings() {
    return this.admin.getAllBookings();
  }
}

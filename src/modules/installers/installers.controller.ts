import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InstallersService } from './installers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('installers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('installer')
@Controller('installer')
export class InstallersController {
  constructor(private installers: InstallersService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.installers.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.installers.updateProfile(req.user.id, body);
  }

  @Get('requests/nearby')
  nearbyRequests(@Req() req: any) {
    return this.installers.getNearbyRequests(req.user.id);
  }

  @Get('jobs')
  activeJobs(@Req() req: any) {
    return this.installers.getActiveJobs(req.user.id);
  }
}

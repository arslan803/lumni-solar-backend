import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InstallersService } from './installers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('installers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('installer')
export class InstallersController {
  constructor(private installers: InstallersService) {}

  // ─── Installer-only endpoints ────────────────────────────────────────────────

  @Get('profile')
  @Roles('installer')
  getProfile(@Req() req: any) {
    return this.installers.getProfile(req.user.id);
  }

  @Patch('profile')
  @Roles('installer')
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.installers.updateProfile(req.user.id, body);
  }

  @Patch('profile/cnic')
  @Roles('installer')
  updateCnic(@Req() req: any, @Body() body: { cnicNumber: string }) {
    return this.installers.updateCnic(req.user.id, body.cnicNumber);
  }

  @Post('profile/photo')
  @Roles('installer')
  @UseInterceptors(FileInterceptor('file', { storage: require('multer').memoryStorage() }))
  uploadProfilePhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.installers.uploadProfilePhoto(req.user.id, file);
  }

  @Post('profile/certificate')
  @Roles('installer')
  @UseInterceptors(FileInterceptor('file', { storage: require('multer').memoryStorage() }))
  uploadCertificate(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.installers.uploadCertificate(req.user.id, file);
  }

  @Get('gallery')
  @Roles('installer')
  getGallery(@Req() req: any) {
    return this.installers.getGallery(req.user.id);
  }

  @Post('gallery')
  @Roles('installer')
  @UseInterceptors(FileInterceptor('file', { storage: require('multer').memoryStorage() }))
  addGalleryPhoto(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption: string,
  ) {
    return this.installers.addGalleryPhoto(req.user.id, file, caption);
  }

  @Delete('gallery/:id')
  @Roles('installer')
  deleteGalleryPhoto(@Req() req: any, @Param('id') id: string) {
    return this.installers.deleteGalleryPhoto(req.user.id, id);
  }

  @Get('requests/nearby')
  @Roles('installer')
  nearbyRequests(@Req() req: any) {
    return this.installers.getNearbyRequests(req.user.id);
  }

  @Get('jobs')
  @Roles('installer')
  activeJobs(@Req() req: any) {
    return this.installers.getActiveJobs(req.user.id);
  }

  // ─── Public profile (customer + installer + admin) ───────────────────────────

  @Get('public/:id')
  @Roles('customer', 'installer', 'admin')
  getPublicProfile(@Param('id') id: string) {
    return this.installers.getPublicProfile(id);
  }
}

import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer')
@Controller('bookings')
export class RatingsController {
  constructor(private ratings: RatingsService) {}

  @Post(':id/rate')
  rate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { score: number; comment?: string },
  ) {
    return this.ratings.create(id, req.user.id, body.score, body.comment);
  }
}

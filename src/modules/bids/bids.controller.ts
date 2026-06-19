import { Controller, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { CreateBidDto } from './bids.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private bids: BidsService) {}

  @Roles('installer')
  @Post()
  create(@Req() req: any, @Body() dto: CreateBidDto) {
    return this.bids.create(req.user.id, dto);
  }

  @Roles('installer')
  @Patch(':id/withdraw')
  withdraw(@Req() req: any, @Param('id') id: string) {
    return this.bids.withdraw(id, req.user.id);
  }
}

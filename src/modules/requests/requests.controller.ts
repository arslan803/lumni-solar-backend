import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './requests.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private requests: RequestsService) {}

  @Roles('customer')
  @Post()
  create(@Req() req: any, @Body() dto: CreateRequestDto) {
    return this.requests.create(req.user.id, dto);
  }

  @Roles('customer')
  @Get()
  findMine(@Req() req: any) {
    return this.requests.findByCustomer(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.requests.findOne(id, req.user.id, req.user.role);
  }

  @Roles('customer')
  @Post(':id/select-bid')
  selectBid(
    @Req() req: any,
    @Param('id') id: string,
    @Body('bidId') bidId: string,
  ) {
    return this.requests.selectBid(id, req.user.id, bidId);
  }
}

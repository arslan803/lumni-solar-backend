import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JazzcashService } from './jazzcash.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('jazzcash')
@Controller('jazzcash')
export class JazzcashController {
  constructor(private jazzcash: JazzcashService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Post('bookings/:id/pay-deposit')
  payDeposit(@Req() req: any, @Param('id') id: string) {
    return this.jazzcash.initiateDeposit(id, req.user.id);
  }

  @Post('ipn')
  ipn(@Body() body: Record<string, string>) {
    return this.jazzcash.handleIpn(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @Post('bookings/:id/simulate-payment')
  simulate(@Param('id') id: string) {
    return this.jazzcash.simulatePayment(id);
  }
}

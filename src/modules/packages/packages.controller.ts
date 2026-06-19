import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PackagesService } from './packages.service';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private packages: PackagesService) {}

  @Get()
  findAll() {
    return this.packages.findAll();
  }
}

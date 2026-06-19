import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateBidDto {
  @IsUUID()
  requestId: string;

  @IsNumber()
  @Min(1)
  perWattRate: number;

  @IsNumber()
  @Min(1)
  warrantyWorkmanshipYr: number;

  @IsNumber()
  @Min(1)
  estimatedDays: number;

  @IsOptional()
  @IsString()
  message?: string;
}

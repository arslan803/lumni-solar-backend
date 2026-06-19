import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoofType } from '@prisma/client';

export class CreateRequestDto {
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  phoneNumber: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  systemSizeKw: number;

  @IsIn(['ongrid', 'hybrid'])
  systemType: string;

  @IsIn(['ground_mounted', 'elevated'])
  structureType: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  totalAreaMarla: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  buildingHeightFt: number;

  @IsIn(['residential', 'commercial', 'industrial'])
  propertyType: string;

  @ValidateIf((o) => o.propertyType === 'industrial')
  @IsString()
  transformerCapacity?: string;

  @IsIn(['own', 'rental'])
  ownershipStatus: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  sanctionedLoadKw: number;

  @IsEnum(RoofType)
  roofType: RoofType;

  @IsIn(['no_shade', 'partial_shade', 'heavy_shade'])
  shadingOnRoof: string;

  @IsIn(['lesco', 'iesco', 'other'])
  electricityProvider: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentElectricityBill: number;

  @IsIn(['reduce_bill', 'backup_required', 'environmental'])
  interestReason: string;

  @IsIn(['immediate', 'within_week', 'within_month', 'just_researching'])
  installationTimeline: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bidDeadlineHours?: number;
}

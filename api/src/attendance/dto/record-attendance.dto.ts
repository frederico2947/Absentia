import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RecordAttendanceDto {
  @IsIn(['check-in', 'check-out'])
  type!: 'check-in' | 'check-out';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  faceConfidence?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

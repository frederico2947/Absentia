import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class RecordAttendanceDto {
  @IsIn(['check-in', 'check-out'])
  type!: 'check-in' | 'check-out';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  faceConfidence?: number;
}

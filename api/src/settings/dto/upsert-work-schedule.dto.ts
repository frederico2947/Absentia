import { IsInt, Max, Min } from 'class-validator';

export class UpsertWorkScheduleDto {
  @IsInt()
  @Min(0)
  @Max(23)
  workStartHour!: number;

  @IsInt()
  @Min(0)
  @Max(120)
  lateThresholdMinutes!: number;
}

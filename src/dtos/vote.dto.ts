import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  public songId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  @IsInt()
  public score: number;
}

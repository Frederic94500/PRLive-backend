import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  public songId: string;

  @IsString()
  @IsNotEmpty()
  public userId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  public score: number;
}

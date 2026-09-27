import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartRunDto {
  @IsString()
  @IsNotEmpty()
  scenarioId!: string;
}

// Без choiceId — «время вышло»: так фронт сообщает, что таймер дошёл до нуля
export class ChooseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  choiceId?: string;
}

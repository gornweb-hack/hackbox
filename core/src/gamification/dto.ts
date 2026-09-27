import { IsIn } from 'class-validator';
import { RATING_SCOPES, type RatingScope } from './rating.js';

export class RatingQueryDto {
  @IsIn(RATING_SCOPES, { message: 'scope — одно из: crew, depot, company' })
  scope!: RatingScope;
}

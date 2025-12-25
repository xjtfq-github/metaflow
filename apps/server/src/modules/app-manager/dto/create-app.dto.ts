import { ApiProperty } from '@nestjs/swagger';

export class CreateAppDto {
  @ApiProperty({
    example: 'My App',
    description: 'The name of the application',
  })
  name: string;

  @ApiProperty({
    example: 'This is a test app',
    description: 'Description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'icon-home',
    description: 'Icon class name',
    required: false,
  })
  icon?: string;
}

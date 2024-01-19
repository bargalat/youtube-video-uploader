import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CronService } from './services/cron.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cronService: CronService) {}

  @Get()
  getHello() {

    return "Hello world";
  }

  @Get('/uploadVideo')
  async uploadVideoToYoutube() {
    await this.cronService.handleCron(); 
    return 'Video yükleme işlemi başlatıldı.';
  }
}

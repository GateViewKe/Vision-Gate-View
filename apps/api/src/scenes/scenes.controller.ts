import { Controller, Get } from '@nestjs/common';
import { ScenesService } from './scenes.service';

@Controller('scenes/jkia-main')
export class ScenesController {
  constructor(private readonly scenesService: ScenesService) {}

  @Get('nodes')
  getNodes() {
    return this.scenesService.getNodes();
  }

  @Get('connections')
  getConnections() {
    return this.scenesService.getConnections();
  }
}
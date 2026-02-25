import { Controller, Get, Param } from '@nestjs/common';
import { AirportsService } from './airports.service';

@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Get()
  getAirports() {
    return this.airportsService.findAll();
  }

  @Get(':id')
  getAirport(@Param('id') id: string) {
    return this.airportsService.findOne(id);
  }
}
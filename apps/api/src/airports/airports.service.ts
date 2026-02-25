import { Injectable } from '@nestjs/common';
import { jkiaAirport } from '../spatial-data/jkia.mock';

@Injectable()
export class AirportsService {
  findAll() {
    return [jkiaAirport];
  }

  findOne(id: string) {
    if (id === 'jkia') return jkiaAirport;
    return null;
  }
}
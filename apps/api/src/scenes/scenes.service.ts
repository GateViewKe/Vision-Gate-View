import { Injectable } from '@nestjs/common';
import { jkiaAirport, jkiaConnections } from '../spatial-data/jkia.mock';

@Injectable()
export class ScenesService {
  getNodes() {
    return jkiaAirport.pois;
  }

  getConnections() {
    return jkiaConnections;
  }
}
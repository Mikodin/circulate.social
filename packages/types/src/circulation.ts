import { Circle } from './circle';

export interface Circulation {
  urn: string;
  circulationId: string;
  userId: string;
  circles: string[];
  circleDetails?: Map<string, Circle>;
  frequency: Circle['frequency'];
}
// export interface UpcomingCirculation extends Circulation {}

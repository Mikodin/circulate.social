import { Circle } from './circle';

export interface CirclePreview {
  circleId: string;
  createdAt: string;
  updatedAt: string;
  memberNames: string[];
  creatorName: string;
  name: string;
  description: string;
  totalContentCount: number;
  upcomingContentCount: number;
  frequency: Circle['frequency'];
  privacy: Circle['privacy'];
}

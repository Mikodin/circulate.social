import { Event } from './event';

export interface Circle {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  creatorId: string;
  name: string;
  description: string;
  events: string[];
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  privacy: 'private' | 'public';
  upcomingEventDetails?: Event[];
}

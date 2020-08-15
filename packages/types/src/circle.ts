import { Content } from './content';

export interface Circle {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  creatorId: string;
  name: string;
  description: string;
  content?: string[];
  upcomingContentIds?: string[];
  contentDetails?: Content[];
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  privacy: 'private' | 'public';
}

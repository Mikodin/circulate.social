import { Content } from './content';

export interface Circle {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  createdBy: string;
  name: string;
  description: string;
  content?: string[];
  upcomingContentIds?: string[];
  contentDetails?: Content[];
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  privacy: 'private' | 'public';
}

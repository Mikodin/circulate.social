export interface Content {
  id: string;
  createdBy: string;
  title: string;
  circleIds: string[];
  dateTime: string;
  privacy: 'private' | 'public';
  description?: string;
  link?: string;
  categories?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

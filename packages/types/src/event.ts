export interface Event {
  id: string;
  createdAt: string;
  updatedAt: string;
  members: string[];
  creatorId: string;
  name: string;
  description: string;
  circleId?: string;
}

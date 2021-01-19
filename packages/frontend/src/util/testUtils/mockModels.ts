import { Circle, User } from '@circulate/types';

export const mockCircle = {
  id: 'asdf-someCircle-id',
  createdAt: '123',
  updatedAt: '123',
  members: ['dev-id'],
  createdBy: 'dev-id',
  name: 'The greatest circle',
  description: 'Great things happen here',
  frequency: 'daily',
  privacy: 'private',
} as Circle;

export const mockUser = {
  id: 'some_user',
  email: 'billNye@circulate.social',
  firstName: 'Bill',
  lastName: 'Nye',
  timezone: 'UTC',
  createdAt: '123',
  updatedAt: '13',
} as User;

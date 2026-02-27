/**
 * AI Task Model - Not used in Digital Heirloom
 * This file exists only to prevent build errors from legacy subtitle extract code
 */

export interface AITask {
  id: string;
  userId?: string;
  mediaType?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  status?: string;
  costCredits?: number;
  scene?: string;
  taskInfo?: string;
  taskResult?: string;
  taskId?: string;
  createdAt?: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface GetAITasksParams {
  userId?: string;
  getUser?: boolean;
  page?: number;
  limit?: number;
  mediaType?: string;
}

export async function getAITasks(params: GetAITasksParams = {}): Promise<AITask[]> {
  // AI tasks are not available in Digital Heirloom
  return [];
}

export async function getAITasksCount(params: { userId?: string; mediaType?: string } = {}): Promise<number> {
  // AI tasks are not available in Digital Heirloom
  return 0;
}

export async function findAITaskById(id: string): Promise<AITask | null> {
  // AI tasks are not available in Digital Heirloom
  return null;
}

export async function updateAITaskById(id: string, data: Partial<AITask>): Promise<void> {
  // AI tasks are not available in Digital Heirloom
  // No-op
}

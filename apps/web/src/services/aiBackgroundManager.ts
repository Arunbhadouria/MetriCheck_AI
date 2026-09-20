/**
 * Background AI Task Manager
 * - Manages asynchronous, non-blocking AI image uploads and OCR/Rule Engine processing.
 * - Allows officers and consumers to continue scanning subsequent products without waiting.
 * - Provides reactive state hooks and waitForAllTasks() for final submission circle loader.
 */

export interface AiBackgroundTask {
  id: string;
  inspectionId?: string;
  productName: string;
  type: 'INSPECTOR' | 'CONSUMER';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: number;
  completedAt?: number;
  error?: string;
}

type Listener = () => void;

class AiBackgroundManager {
  private tasks: Map<string, AiBackgroundTask> = new Map();
  private promises: Map<string, Promise<any>> = new Map();
  private listeners: Set<Listener> = new Set();

  /**
   * Dispatches a new background AI task.
   * Runs the executor promise asynchronously and updates subscribers on progress.
   */
  public dispatchTask(
    meta: {
      id?: string;
      inspectionId?: string;
      productName: string;
      type: 'INSPECTOR' | 'CONSUMER';
    },
    executor: () => Promise<any>
  ): string {
    const taskId = meta.id || `ai_task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const task: AiBackgroundTask = {
      id: taskId,
      inspectionId: meta.inspectionId,
      productName: meta.productName,
      type: meta.type,
      status: 'PROCESSING',
      startedAt: Date.now()
    };

    this.tasks.set(taskId, task);
    this.notify();

    const taskPromise = executor()
      .then((res) => {
        const current = this.tasks.get(taskId);
        if (current) {
          current.status = 'COMPLETED';
          current.completedAt = Date.now();
        }
        return res;
      })
      .catch((err) => {
        console.error(`[AI Background Manager] Task ${taskId} failed:`, err);
        const current = this.tasks.get(taskId);
        if (current) {
          current.status = 'FAILED';
          current.error = err?.message || 'Processing encountered an error';
          current.completedAt = Date.now();
        }
      })
      .finally(() => {
        this.promises.delete(taskId);
        this.notify();
      });

    this.promises.set(taskId, taskPromise);
    return taskId;
  }

  /**
   * Checks if any AI background tasks are currently running.
   */
  public isAnyTaskRunning(inspectionId?: string): boolean {
    for (const task of this.tasks.values()) {
      if (task.status === 'PROCESSING' || task.status === 'QUEUED') {
        if (!inspectionId || task.inspectionId === inspectionId) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Returns all active running tasks.
   */
  public getRunningTasks(inspectionId?: string): AiBackgroundTask[] {
    const running: AiBackgroundTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.status === 'PROCESSING' || task.status === 'QUEUED') {
        if (!inspectionId || task.inspectionId === inspectionId) {
          running.push(task);
        }
      }
    }
    return running;
  }

  /**
   * Returns all completed or failed tasks for history.
   */
  public getAllTasks(inspectionId?: string): AiBackgroundTask[] {
    const list: AiBackgroundTask[] = [];
    for (const task of this.tasks.values()) {
      if (!inspectionId || task.inspectionId === inspectionId) {
        list.push(task);
      }
    }
    return list;
  }

  /**
   * Waits for all active tasks (or tasks for a specific inspection) to complete.
   * Useful when user clicks "Final Submit" so a circle loader can show until complete.
   */
  public async waitForAllTasks(inspectionId?: string): Promise<void> {
    const promisesToWait: Promise<any>[] = [];
    for (const [taskId, promise] of this.promises.entries()) {
      const task = this.tasks.get(taskId);
      if (!inspectionId || task?.inspectionId === inspectionId) {
        promisesToWait.push(promise);
      }
    }

    if (promisesToWait.length === 0) return;
    // Strict safety timeout: never block UI for more than 3.5 seconds
    await Promise.race([
      Promise.allSettled(promisesToWait),
      new Promise(resolve => setTimeout(resolve, 3500))
    ]);
  }

  /**
   * Subscribe for reactive state updates in React components.
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error notifying aiBackgroundManager listener:', e);
      }
    });
  }
}

import { useState, useEffect } from 'react';

export const aiBackgroundManager = new AiBackgroundManager();

export function useAiBackgroundTasks(inspectionId?: string) {
  const [runningTasks, setRunningTasks] = useState<AiBackgroundTask[]>(() =>
    aiBackgroundManager.getRunningTasks(inspectionId)
  );

  useEffect(() => {
    const unsubscribe = aiBackgroundManager.subscribe(() => {
      setRunningTasks(aiBackgroundManager.getRunningTasks(inspectionId));
    });
    return unsubscribe;
  }, [inspectionId]);

  return {
    runningTasks,
    isProcessing: runningTasks.length > 0,
    waitForAllTasks: () => aiBackgroundManager.waitForAllTasks(inspectionId)
  };
}

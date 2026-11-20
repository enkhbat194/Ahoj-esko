// Compatibility for the first lesson's original progress files and callers.
import { L01_ID } from '../data/l01WorkingSource';
import { starterCourse } from './courseSource';
import {
  freshProgress, loadProgress, parseProgress, progressKey, reviewedCount, saveProgress, updateResponse,
  type CourseProgress,
} from './courseProgress';

const lesson = starterCourse.lessons[0];
export type L01PracticeProgress = CourseProgress;
export const L01_PROGRESS_KEY = progressKey(L01_ID);
export const createL01Progress = () => freshProgress(lesson);
export const loadL01Progress = () => loadProgress(lesson);
export const parseL01Progress = (input: unknown) => parseProgress(input, lesson);
export const saveL01Progress = (p: CourseProgress) => {
  const safe = parseProgress(p, lesson);
  return safe ? saveProgress(safe) : false;
};
export const updateL01Response = (p: CourseProgress, id: string, value: string) => updateResponse(p, id, value, lesson);
export const reviewedL01Count = (p: CourseProgress) => reviewedCount(p, lesson);

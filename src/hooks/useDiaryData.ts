import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMonthlyDiaries, saveDiary } from '../services/diary';
import { formatDate } from '../utils/dateUtils';
import type { DiaryEntry } from '../types/diary';

// React Query 키 관리
export const DIARY_KEYS = {
  all: ['diaries'] as const,
  monthly: (year: number, month: number) => [...DIARY_KEYS.all, year, month] as const,
};

/**
 * 특정 월의 일기 데이터를 가져오는 훅
 * @param year 년도 (YYYY)
 * @param month 월 (0-11, JavaScript Month Index)
 */
export const useMonthlyDiaries = (year: number, month: number) => {
  return useQuery({
    queryKey: DIARY_KEYS.monthly(year, month),
    queryFn: async () => {
      // 백엔드 API는 1-based month를 사용 (1~12)
      return await getMonthlyDiaries(month + 1);
    },
    staleTime: 1000 * 60 * 5, // 5분간 fresh 유지
  });
};

/**
 * 오늘 날짜의 일기가 존재하는지 확인하는 훅
 */
export const useHasTodayDiary = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayStr = formatDate(today, '-'); // YYYY-MM-DD 형식으로 비교

  const { data: monthlyDiaries, isLoading } = useMonthlyDiaries(year, month);

  // 일기 목록 중 오늘 날짜와 일치하는 것이 있는지 확인
  const hasTodayDiary = monthlyDiaries?.some((diary: DiaryEntry) => diary.date === todayStr) ?? false;

  return { hasTodayDiary, isLoading };
};

/**
 * 일기 저장 훅
 */
export const useSaveDiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveDiary,
    onSuccess: (_, variables) => {
      // 저장된 일기의 날짜를 파싱하여 해당 월의 캐시를 무효화
      const date = new Date(variables.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      queryClient.invalidateQueries({ 
        queryKey: DIARY_KEYS.monthly(year, month) 
      });
    },
  });
};

// 하위 호환성을 위해 기존 함수 이름들과 비슷한 헬퍼 제공 (선택 사항)
// 하지만 StatsPage를 리팩토링할 것이므로 굳이 만들지 않음.

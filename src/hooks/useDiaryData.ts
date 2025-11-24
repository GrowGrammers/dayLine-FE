import { DUMMY_DATA } from '../data/dummyDiaryData';
import { isSameMonth } from '../utils/dateUtils';

export const useDiaryData = () => {
  /**
   * [추후 API 연동 시 변경 가이드]
   * 
   * 1. 데이터 페칭 라이브러리 도입 (React Query)
   *    - 캐싱, 로딩 상태 관리, 중복 요청 방지 등을 쉽게 처리.
   *    - npm install @tanstack/react-query
   * 
   * 2. API 함수 정의 예시 (api/diary.ts)
   *    export const fetchMonthlyDiaries = async (year: number, month: number) => {
   *      const response = await fetch(`/api/diaries?year=${year}&month=${month + 1}`);
   *      return response.json();
   *    };
   * 
   * 3. Hook 수정 예시
   *    import { useQuery } from '@tanstack/react-query';
   * 
   *    // 특정 월 데이터 가져오기 (캐싱 적용됨)
   *    const useMonthlyDiaries = (year: number, month: number) => {
   *      return useQuery({
   *        queryKey: ['diaries', year, month],
   *        queryFn: () => fetchMonthlyDiaries(year, month),
   *        staleTime: 1000 * 60 * 5, // 5분간 fresh 상태 유지
   *        gcTime: 1000 * 60 * 30,   // 30분간 캐시 유지 (구 cacheTime)
   *      });
   *    };
   * 
   *    // Swiper 등에서 월 변경 시마다 자동으로 해당 월 데이터를 fetch/캐시 사용
   *    const { data, isLoading } = useMonthlyDiaries(currentYear, currentMonth);
   */

  // 전체 데이터 반환
  const getAllData = () => {
    return DUMMY_DATA;
  };

  // 특정 월의 데이터 필터링 및 정렬 (날짜 오름차순)
  const getMonthlyData = (year: number, month: number) => {
    // API 연동 시:
    // const { data } = useMonthlyDiaries(year, month);
    // return data || [];
    
    return DUMMY_DATA
      .filter(d => isSameMonth(d.date, year, month))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // 특정 날짜의 데이터 찾기
  const getEntryByDate = (date: string) => {
    // API 연동 시:
    // React Query의 queryClient.getQueryData(['diaries', year, month])를 활용하거나
    // 상세 조회 API를 별도로 호출 (ex: fetchDiaryDetail(date))
    
    return DUMMY_DATA.find(d => d.date === date) || null;
  };

  // 특정 월의 가장 최근 데이터 찾기 (날짜 내림차순 정렬 후 첫 번째)
  const getRecentEntry = (year: number, month: number) => {
    // API 연동 시:
    // 월별 데이터를 받아온 후 클라이언트에서 정렬하거나,
    // 백엔드에 정렬 옵션을 주어 요청 (ex: /api/diaries?sort=desc&limit=1)
    
    return DUMMY_DATA
      .filter(d => isSameMonth(d.date, year, month))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
  };

  return {
    getAllData,
    getMonthlyData,
    getEntryByDate,
    getRecentEntry,
  };
};

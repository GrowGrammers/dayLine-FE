// 일기 관련 API 서비스
// 백엔드 API 스펙 기준

import { apiRequest } from './api';
import { getUserKey } from './tossAuth';

// 백엔드 응답 DTO
interface DiaryResDto {
  line: string;      // 일기 내용
  score: number;     // 감정 점수
  date: string;      // YYYY-MM-DD
}

// 클라이언트 사용 인터페이스 (기존 호환성 유지)
export interface DiaryEntry {
  date: string;      // YYYY-MM-DD
  content: string;   // line
  emotion: number;   // score
}

// 일기 저장 요청
interface DiaryCreateRequest {
  userId: number;
  line: string;
  score: number;
  date: string;  // YYYY-MM-DD
}

/**
 * 일기 목록 조회 (전체 조회 후 클라이언트에서 월별 필터링)
 * 
 * @param year 연도 (선택적)
 * @param month 월 (1-12, 선택적)
 * @returns 일기 목록
 */
export async function getMonthlyDiaries(
  year?: number,
  month?: number
): Promise<DiaryEntry[]> {
  const userKey = getUserKey();
  if (!userKey) {
    throw new Error('로그인이 필요합니다.');
  }

  // 백엔드 API: GET /api/v1/scores?userId={userId}
  const response = await apiRequest<DiaryResDto[]>(
    `/api/v1/scores?userId=${userKey}`,
    {
      method: 'GET',
    }
  );

  // DTO를 클라이언트 인터페이스로 변환
  let diaries: DiaryEntry[] = response.map(dto => ({
    date: dto.date,
    content: dto.line,
    emotion: dto.score,
  }));

  // 월별 필터링 (옵션)
  if (year !== undefined && month !== undefined) {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;
    diaries = diaries.filter(diary => diary.date.startsWith(targetMonth));
  }

  return diaries;
}

/**
 * 특정 날짜의 일기 조회
 * 
 * @param date 날짜 (YYYY-MM-DD)
 * @returns 일기 데이터 또는 null
 */
export async function getDiaryByDate(date: string): Promise<DiaryEntry | null> {
  const userKey = getUserKey();
  if (!userKey) {
    throw new Error('로그인이 필요합니다.');
  }

  try {
    // 전체 일기 조회 후 해당 날짜 필터링
    const response = await apiRequest<DiaryResDto[]>(
      `/api/v1/scores?userId=${userKey}`,
      {
        method: 'GET',
      }
    );

    const diary = response.find(dto => dto.date === date);
    
    if (diary) {
      return {
        date: diary.date,
        content: diary.line,
        emotion: diary.score,
      };
    }
    return null;
  } catch {
    // 에러 발생 시 null 반환
    return null;
  }
}

/**
 * 일기 작성/수정
 * 
 * @param data 일기 데이터 (date, content, emotion)
 * @returns 저장된 일기
 */
export async function saveDiary(data: {
  date: string;
  content: string;
  emotion: number;
}): Promise<DiaryEntry> {
  const userKey = getUserKey();
  if (!userKey) {
    throw new Error('로그인이 필요합니다.');
  }

  // 백엔드 API: POST /api/v1/scores
  const requestBody: DiaryCreateRequest = {
    userId: Number(userKey),
    line: data.content,
    score: data.emotion,
    date: data.date,
  };

  await apiRequest<void>(
    '/api/v1/scores',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  // 성공 응답만 오므로, 저장한 데이터를 그대로 반환
  return {
    date: data.date,
    content: data.content,
    emotion: data.emotion,
  };
}

/**
 * 일기 삭제
 * 
 * @deprecated 백엔드에서 삭제 API를 제공하지 않습니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteDiary(_date: string): Promise<void> {
  // TODO: 백엔드에서 삭제 API 제공 시 구현
  throw new Error('일기 삭제 기능은 현재 지원되지 않습니다.');
}


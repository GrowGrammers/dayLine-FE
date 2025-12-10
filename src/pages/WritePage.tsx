import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Text,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { useQueryClient } from '@tanstack/react-query';
import { getToday, formatDate } from '../utils/dateUtils';
import { useTextInput } from '../hooks/useTextInput';
import { useHasTodayDiary, useSaveDiary, DIARY_KEYS } from '../hooks/useDiaryData';
import { analyzeDiaryText } from '../services/gpt';
import { AdPromotionBottomSheet } from '../components/bottomSheets/AdPromotionBottomSheet';
//import { adaptive } from '@toss/tds-colors';

export default function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdSheetOpen, setIsAdSheetOpen] = useState(false);
  
  const {
    value,
    trimmedValue,
    characterCount,
    hasError,
    errorMessage,
    isSubmittable,
    handleChange,
  } = useTextInput();
  
  // 오늘 작성 여부 확인
  const { hasTodayDiary, isLoading: isChecking } = useHasTodayDiary();
  const { mutateAsync: saveDiaryMutation } = useSaveDiary();
  
  // 오늘 날짜 가져오기
  const today = useMemo(() => getToday(), []);
  const formattedDate = formatDate(today);

  // 페이지 진입 시 데이터 갱신 (뒤로가기로 왔을 때 대비)
  useEffect(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // 현재 월의 데이터 무효화하여 최신 상태 확인
    queryClient.invalidateQueries({ 
      queryKey: DIARY_KEYS.monthly(year, month) 
    });
  }, [queryClient, today]);
  
  const handleConfirm = async () => {
    // 이미 작성된 경우 StatsPage로 이동
    if (hasTodayDiary) {
      // 이미 작성된 상태에서 이동 시에는 완료 화면을 생략하고 바로 통계 화면을 보여줌
      navigate('/stats', { state: { skipComplete: true } });
      return;
    }

    if (isSubmittable && !isLoading) {
      // 바텀시트 열기
      setIsAdSheetOpen(true);
    }
  };

  const processDiarySubmission = async () => {
    // 바텀시트 닫기
    setIsAdSheetOpen(false);

    try {
      setIsLoading(true);
      
      // 1단계: GPT API 호출하여 감정 분석
      console.log('GPT API 호출 시작...');
      const gptResponse = await analyzeDiaryText(trimmedValue);
      
      console.log('GPT API 응답 성공:', gptResponse);

      
      // 2단계: GPT 응답 검증
      if (!gptResponse || !gptResponse.line || typeof gptResponse.score !== 'number') {
        throw new Error('GPT 응답이 올바르지 않습니다.');
      }
      
      // 3단계: 백엔드에 저장 (useSaveDiary 사용)
      console.log('백엔드 저장 요청 시작...');
      const dateString = formatDate(today, '-'); // YYYY-MM-DD 형식
      
      // mutateAsync는 onSuccess(invalidateQueries)가 완료될 때까지 기다림
      await saveDiaryMutation({
        date: dateString,
        content: gptResponse.line,
        emotion: gptResponse.score,
      });

      console.log('백엔드 저장 및 데이터 갱신 완료!');
      
      // 4단계: 성공 후 다음 페이지로 이동
      navigate('/stats');
    } catch (error) {
      console.error('에러 발생:', error);
      
      // 사용자 친화적인 에러 메시지
      if (error instanceof Error) {
        if (error.message.includes('로그인')) {
          alert('로그인이 필요해요.');
        } else if (error.message.includes('GPT')) {
          alert('일기 분석 중 오류가 발생했어요. 다시 시도해주세요.');
        } else if (error.message.includes('네트워크')) {
          alert('네트워크 연결을 확인해주세요.');
        } else {
          alert('저장 중 오류가 발생했어요. 다시 시도해주세요.');
        }
      } else {
        alert('알 수 없는 오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {/* 로딩 오버레이 (전면 광고 영역) */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: adaptive.background,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }}>
          <Text typography="t4" fontWeight="bold">
            일기를 분석하고 있어요
          </Text>
          <Text typography="t6" color={adaptive.grey600}>
            잠시만 기다려주세요...
          </Text>
          {/* 광고가 들어갈 자리 */}
          <div style={{
            width: '300px',
            height: '250px',
            backgroundColor: adaptive.grey100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '20px',
            borderRadius: '12px'
          }}>
             <Text typography="t6" color={adaptive.grey500}>
                (광고 영역)
             </Text>
          </div>
        </div>
      )}

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 숫자키패드 사용을 위해서는 type="number" 대신 inputMode="numeric"를 사용해주세요. */}
        <div>
          <TextField.Clearable
            variant="box"
            hasError={hasError}
            label={`${formattedDate} 한 줄`}
            labelOption="sustain"
            value={value}
            onChange={handleChange}
            placeholder={hasTodayDiary ? "오늘의 일기를 이미 작성했어요" : "50자 이내로 입력"}
            disabled={hasTodayDiary || isChecking || isLoading}
            style={{ textAlign: 'left' }}
          />
          <div style={{ 
            marginTop: '8px', 
            fontSize: '14px', 
            color: hasError ? '#f04452' : '#8b95a1',
            textAlign: 'right'
          }}>
            {hasTodayDiary ? '내일 또 만나요!' : (errorMessage || characterCount)}
          </div>
        </div>
        <Button 
          display="block" 
          // 작성 완료 상태이거나 로딩 중이면 비활성화 처리하지 않고, 
          // hasTodayDiary일 때는 활성화하여 "보러가기" 버튼으로 사용
          disabled={(!hasTodayDiary && (!isSubmittable || isLoading || isChecking))} 
          onClick={handleConfirm}
          variant={hasTodayDiary ? "weak" : "fill"}
        >
          {hasTodayDiary ? '그래프 보러가기' : (isLoading ? '분석 중...' : '작성 완료')}
        </Button>
      </div>

      <AdPromotionBottomSheet
        open={isAdSheetOpen}
        onClose={() => setIsAdSheetOpen(false)}
        onNavigate={processDiarySubmission}
      />
    </>
  );
}

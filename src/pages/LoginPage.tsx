import { Asset, Button, Top } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithToss } from '../services/tossAuth';

export default function Page() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // 토스 로그인 플로우 실행
      await loginWithToss();
      
      console.log('로그인 성공');
      // WritePage로 이동
      navigate('/write');
    } catch (error) {
      console.error('로그인 실패:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '로그인에 실패했습니다. 다시 시도해주세요.';
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Top
        style={{ textAlign: 'left' }}
        // upperGap={32}
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900} aria-label="로그인 페이지 제목">
            오늘 한 줄에서 토스로 로그인할까요?
          </Top.TitleParagraph>
        }
        upper={
          <Top.UpperAssetContent
            content={
              <Asset.Lottie
                frameShape={Asset.frameShape.CleanW60}
                src="https://static.toss.im/lotties-common/agree-spot.json"
                loop={false}
                aria-hidden={true}
              />
            }
          />
        }
      />
      <Button display="block" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? '로그인 중...' : '다음'}
      </Button>
    </div>
  );
}

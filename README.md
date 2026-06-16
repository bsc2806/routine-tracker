# 루틴 트래커 (Routine Tracker)

매일의 작은 습관을 체크하고, AI 코치에게 맞춤 조언을 받는 로컬 우선 습관 관리 앱.

> React Native (Expo) · TypeScript · NativeWind · AsyncStorage · Anthropic Claude API

## 주요 기능

- **홈** — 오늘 날짜·완료율(3/5), 루틴 체크, 스트릭(🔥), 전체 완료 시 축하 애니메이션
- **루틴 관리** — 추가/수정/삭제(아카이브), 카테고리·아이콘 선택, 다크모드 토글
- **통계** — 주간 달성률 막대 그래프, 루틴별 달성률, 최고/최저 루틴 하이라이트
- **AI 조언** — 최근 7일 데이터를 Claude API 로 분석해 맞춤 조언 (로딩 스피너 표시)
- 첫 실행 시 샘플 루틴 3개 자동 생성 (운동 💪 / 물 2L 마시기 💧 / 독서 20분 📚)
- 한국어 UI · 다크모드 지원 · 서버 불필요(완전 로컬)

## 시작하기

```bash
# 1) 의존성 설치
npm install

# 2) Expo 권장 버전으로 정렬 (권장)
npx expo install --fix

# 3) 환경변수 설정
cp .env.example .env
#   .env 의 ANTHROPIC_API_KEY 를 실제 키로 교체

# 4) 실행 (안드로이드)
npm run android
```

## 환경변수 (`.env`)

| 키 | 설명 | 기본값 |
|----|------|--------|
| `ANTHROPIC_API_KEY` | Claude API 키 (필수, AI 조언용) | — |
| `ANTHROPIC_MODEL` | 사용할 모델 | `claude-haiku-4-5` |

## 프로젝트 구조

```
app/                      # Expo Router (파일 기반 라우팅)
  _layout.tsx             # 루트 (Provider, 테마, 스택)
  (tabs)/
    _layout.tsx           # 하단 탭 4개
    index.tsx             # 홈
    manage.tsx            # 루틴 관리
    stats.tsx             # 통계
    advice.tsx            # AI 조언
src/
  components/             # ProgressBar, RoutineCheckItem, CelebrationOverlay, RoutineFormModal
  store/AppContext.tsx    # 전역 상태 + AsyncStorage 영속화 + 샘플 시드
  storage/storage.ts      # AsyncStorage CRUD
  lib/anthropic.ts        # Claude API 호출
  utils/                  # 날짜, 스트릭/통계 계산
  types.ts
```

## ⚠️ 배포 관련 보안 주의

현재 v1 은 **클라이언트에서 Claude API 를 직접 호출**합니다(개발/내부 테스트용).
플레이스토어 **공개 배포 전에는 반드시 API 호출을 프록시 서버(서버리스 함수) 경유로 전환**해야 합니다.
빌드된 APK/AAB 를 디컴파일하면 키가 노출되어 요금 도용 위험이 있습니다. 자세한 단계는 `기획안.md` 의 로드맵 참고.

## 로드맵

- **v1 (현재)** — 4탭 기능 완성, 클라이언트 직접 호출, 내부 테스트
- **v2** — 기능 확장 + AI 호출 프록시 전환 + 스토어 자산 준비
- **v3** — 플레이스토어 공개 배포 (프록시 전환 완료가 전제 조건)

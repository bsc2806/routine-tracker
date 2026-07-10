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
#   AI 프록시(Cloudflare Worker) 배포 후 URL/토큰 입력 — proxy/README.md 참고

# 4) 실행 (안드로이드)
npm run android
```

## 환경변수 (`.env`)

> ⚠️ **Claude API 키는 앱 `.env`에 넣지 않습니다.** 키는 프록시 서버(Cloudflare Worker)의
> 시크릿으로만 존재하며, 앱은 프록시 URL만 호출합니다. (`proxy/README.md` 참고)

| 키 | 설명 | 노출 범위 |
|----|------|-----------|
| `EXPO_PUBLIC_PROXY_URL` | 배포된 AI 프록시 Worker URL | 앱 빌드에 포함(공개 URL, 무방) |
| `EXPO_PUBLIC_PROXY_TOKEN` | 프록시 공유 시크릿(약한 게이트) | 앱 빌드에 포함 → 레이트리밋으로 보완 |

`ANTHROPIC_API_KEY`는 `proxy/`의 Worker 시크릿(`wrangler secret put`)으로만 설정합니다.

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

- **Claude API 키**는 앱에 포함되지 않습니다 — Cloudflare Worker(`proxy/`)의 시크릿으로만 존재하고, 앱은 프록시 URL만 호출합니다.
- 앱 빌드에 들어가는 값은 **프록시 URL + 공유 토큰**뿐입니다. 토큰은 디컴파일로 추출 가능한 "약한 게이트"이므로, **Cloudflare 레이트 리밋 + Anthropic 사용 한도/자동충전**으로 요금 도용을 방어합니다. (완전한 보호는 로그인 도입 시 사용자 인증으로 강화)
- 민감한 일기 데이터는 기기에만 저장되며 `android.allowBackup=false`로 평문 백업 추출을 차단했습니다.
- 자세한 단계는 `proxy/README.md` 와 `기획안.md`(9·14장) 참고.

## 로드맵

- **v1 (현재)** — 로컬 전용 + AI 프록시 경유, 공개 배포 준비 완료
- **v2** — 로그인 + 클라우드 동기화(기획안 14장), 프리미엄
- **v3** — 소셜(친구 비교)·위젯·영어 i18n 등

# 루틴 트래커 AI 프록시 (Cloudflare Worker)

앱이 Claude API 를 **직접 호출하지 않도록** 중계하는 서버리스 함수.
API 키는 이 서버의 시크릿에만 존재하므로, 앱 빌드(APK/AAB)를 디컴파일해도 키가 노출되지 않는다.

## 요청 형식

```
POST https://<your-worker>.workers.dev/
content-type: application/json

{ "mode": "advice" | "weekly", "summary": "<루틴 데이터 요약 텍스트>", "token": "<APP_SHARED_SECRET>" }
```

응답: `{ "text": "..." }`

- 시스템 프롬프트(코치 persona·형식)는 **서버 고정** → 범용 Claude 악용 방지
- `token` 이 `APP_SHARED_SECRET` 과 다르면 401

## 배포 방법

```bash
cd proxy
npm install

# 시크릿 등록 (값은 화면에 입력)
npx wrangler login                          # 최초 1회 (브라우저 인증)
npx wrangler secret put ANTHROPIC_API_KEY   # Anthropic 콘솔의 키
npx wrangler secret put APP_SHARED_SECRET   # 임의의 긴 랜덤 문자열 (예: openssl rand -hex 32)

npx wrangler deploy                         # 배포 → https://...workers.dev URL 발급
```

배포 후 발급된 **URL** 과 위에서 정한 **APP_SHARED_SECRET** 을 앱의 `.env` 에 설정:

```
EXPO_PUBLIC_PROXY_URL=https://routine-tracker-proxy.<account>.workers.dev
EXPO_PUBLIC_PROXY_TOKEN=<APP_SHARED_SECRET 과 동일한 값>
```

> ⚠️ 참고: `.env`/`PROXY_URL` 은 `app.config.ts` 의 `extra` 로 주입됩니다.

## 남용 방지 (권장)

- 공유 시크릿 검증은 1차 방어일 뿐(토큰도 앱에서 추출 가능).
- Cloudflare 대시보드에서 **Rate Limiting 규칙**(무료)으로 IP당 분당 요청 수 제한을 거는 것을 권장.
- 완전한 보호는 사용자 로그인(향후 v3) 도입 시 인증 토큰 검증으로 강화.

## 로컬 테스트

```bash
npx wrangler dev
# 다른 터미널에서:
curl -X POST http://localhost:8787 -H "content-type: application/json" \
  -d '{"mode":"advice","summary":"운동 3/7일","token":"<APP_SHARED_SECRET>"}'
```

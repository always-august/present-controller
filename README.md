# 마부 (MABU)

**마무리 부탁드립니다.** 원격 제어형 발표 타이머. 운영자가 노트북/휴대폰에서 타이머와 메시지를 제어하고, 발표자는 공유 링크로 열린 풀스크린 화면을 보면서 발표합니다. stagetimer.io 와 같은 구조입니다.

## 배포 (Railway)

현재 https://present-controller-production.up.railway.app 에 떠 있다. GitHub 연동 없이 CLI로 이 폴더를 직접 올리는 방식.

```bash
npx @railway/cli login        # 최초 1회, 브라우저 승인
npx @railway/cli link         # 최초 1회, 프로젝트/서비스 선택
npx @railway/cli up --ci      # 빌드 + 배포. 코드 바꿀 때마다 실행
```

서비스 설정 (이미 돼 있음. 새로 만들 때 참고):
- Volume: mount path `/data`. 방 스냅샷(SQLite)이 여기 남아 재배포해도 유지된다
- Variables: `RAILWAY_RUN_UID=0`. Railway 볼륨은 root 소유로 마운트되므로 컨테이너도 root로 돈다
- `PORT`는 Railway가 넣어주고 `DATA_DIR=/data`는 Dockerfile에 있다
- 커스텀 도메인: Settings → Networking → Custom Domain에 입력 → 알려주는 CNAME을 DNS에 추가

공개 엔드포인트(방 생성, 청중 질문)에는 IP당 속도 제한이 걸려 있고, 방 개수는 `MAX_ROOMS`를 넘으면 가장 오래 쉰 방부터 정리된다. 환경변수는 `.env.example` 참고.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

프로덕션:

```bash
npm run build
npm start          # NODE_ENV=production, PORT / HOST 환경변수로 변경 가능
```

다른 기기에서 접속하려면 `localhost` 대신 이 컴퓨터의 LAN IP(예: `http://192.168.0.10:3000`)로 열어야 합니다. 컨트롤러의 **링크 공유** 버튼이 각 화면의 링크와 QR 코드를 보여줍니다.

## 화면

| 경로 | 역할 | 접근 |
| --- | --- | --- |
| `/` | 방 생성 | 공개 |
| `/r/:roomId?key=…` | 컨트롤러 — 타이머 CRUD·드래그 정렬·재생 제어·메시지·CSV 임포트·설정·링크 공유 | 비밀키 |
| `/r/:roomId/viewer` | 발표자용 풀스크린 타이머 | 공개 |
| `/r/:roomId/agenda` | 러닝오더와 진행 상황 | 공개 |
| `/r/:roomId/ask` | 청중 질문 제출 폼 | 공개 |
| `/r/:roomId/moderator?key=…` | 메시지 전용 제어 | 비밀키 |
| `/r/:roomId/operator?key=…` | 시작/일시정지/이전/다음/가감만 있는 단순 제어 | 비밀키 |

뷰어 쿼리 옵션: `?chroma=green|blue|magenta|<hex>` (크로마키 배경), `?hideTitle=1`, `?hideSpeaker=1`, `?hideClock=1`, `?hideProgress=1`, `?hideMessages=1`

컨트롤러 단축키: `Space` 재생/일시정지 · `N` 다음 · `P` 이전 · `R` 리셋

## 동작 원리

- **서버는 틱을 보내지 않습니다.** 상태가 바뀔 때만 `deadline`(epoch ms) 기준 `PlaybackState`를 전파하고, 각 클라이언트가 `requestAnimationFrame`으로 로컬 렌더링합니다.
- **시계 보정**: 접속 직후 5회 ping → 왕복 지연이 가장 짧은 샘플의 offset 채택, 이후 30초마다 갱신.
- **뷰어는 멈추지 않습니다.** 연결이 끊겨도 마지막 `deadline`으로 계속 계산하고, 지수 백오프(최대 5초)로 재연결한 뒤 `room:state`로 덮어씁니다.
- **자동 연결(chainNext)과 예약 시작**은 서버 `setTimeout`으로 처리하므로 뷰어만 열려 있어도 동작합니다.
- **영속화**: 인메모리 Map이 단일 진실. 5초마다 변경된 방을 SQLite(`data/rooms.db`, Node 내장 `node:sqlite`)에 스냅샷. 재시작 시 진행 중이던 타이머는 일시정지 상태로 복구됩니다. 24시간 미사용 방은 정리.
- **종료 안내**: 타이머마다 "종료 안내 시점"(wrapUp)을 두면 그 시간 이하로 남았을 때 노란색 전환 + 알림음 + 배너, 0 도달 시 빨간색 + 알림음 + 배너, 이후 `-00:17` 형식으로 초과 시간 표시.

## REST API

WebSocket으로 모든 조작이 가능하지만 Stream Deck 등 외부 도구용으로 최소 REST를 제공합니다.

```
POST   /api/rooms                          → { roomId, controllerKey }
GET    /api/rooms/:id                      공개 상태 조회
POST   /api/rooms/:id/start?key=           body: { timerId? }
POST   /api/rooms/:id/pause?key=
POST   /api/rooms/:id/toggle?key=
POST   /api/rooms/:id/reset?key=
POST   /api/rooms/:id/stop?key=
POST   /api/rooms/:id/next?key=   /prev
POST   /api/rooms/:id/adjust?key=          body: { deltaMs }
POST   /api/rooms/:id/message?key=         body: { text, color?, flash?, bold?, visible? }
DELETE /api/rooms/:id/message/:msgId?key=
POST   /api/rooms/:id/questions            body: { text }  (공개, 청중 질문)
```

`key`는 쿼리스트링 또는 JSON body의 `key` 필드로 전달합니다.

## 구조

```
server/          커스텀 Node 서버 (Next + ws + REST, 한 포트)
  index.ts       HTTP/업그레이드 라우팅
  engine.ts      재생 상태 전환, 타이머/메시지 CRUD, 서버 스케줄러
  ws.ts          WebSocket 세션·권한·브로드캐스트
  rest.ts        REST 핸들러
  store.ts       인메모리 Map + SQLite 스냅샷 + 만료
shared/types.ts  도메인 모델과 이벤트 타입 (서버·클라이언트 공유)
src/
  store/room.ts  Zustand 스토어 (WS 수신 → 상태 반영)
  lib/socket.ts  재연결·시계 보정
  hooks/         useCountdown(rAF), useWakeLock, useChime
  views/         역할별 화면
  components/    컨트롤러 UI 조각
```

## 수동 검증 체크리스트

1. 기기 3대(노트북·휴대폰·태블릿) 동시 접속 후 표시 시간 일치
2. 뷰어 새로고침 후 진행 상태 즉시 복원
3. 타이머 진행 중 비행기모드 30초 후 복귀 시 시간 정확도
4. 0을 지난 뒤 초과 시간이 음수로 계속 증가
5. 컨트롤러 2개를 동시에 열고 한쪽 조작이 다른 쪽에 반영
6. 브라우저 탭을 백그라운드로 보낸 뒤 복귀 시 시간 점프 없음
7. 아이패드 장시간 방치 시 화면 유지(Wake Lock / nosleep 폴백)

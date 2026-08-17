SAI WEB V3.4.3
- 가격 규칙 수정: 일반 기주 +500원/0.5oz, 론디아즈 +1,000원/0.5oz, 리큐르 +1,000원/0.5oz
- 기본가격 13,000원 하한 유지

# SAI WEB V2 — 전체 기능 실행형 프로토타입

## 포함된 고객 기능
- 실제 사이 로고와 실제 매장 사진
- 확정 스플래시 애니메이션
- 고객 화면 / 관리자 화면 완전 분리
- AI 기반 칵테일 추천
- 가격대, 도수, 맛, 기분 기반 추천
- 시그니처 최신 감성 설명
- 당신의 사이 커스텀 레시피 제작 및 공유
- 공감·선택 집계와 이달의 칵테일 랭킹
- 같은 술을 주문한 이전 손님의 글귀 보기
- 다음 손님에게 글귀 남기기
- 재방문 시 과거 글귀 랜덤 회상
- 사이의 추억 미니 인스타그램
- 사진 업로드, 좋아요, 댓글, SAI PICK
- QR 방문 인증 데모

## 관리자 기능
- 메뉴/카테고리/가격/고객 설명 수정
- 직원용 레시피/제조법 별도 관리
- 점수·원가 관리
- 병 구매가 기반 원가 계산
- 사이의 추억 검수, 삭제, SAI PICK
- 손님 레시피와 랭킹 확인
- JSON 백업

## 업로드
압축을 풀고 안의 모든 파일을 GitHub `sai-web` 저장소 최상단에 한 번에 업로드하여 기존 파일을 덮어쓴 뒤 Commit 합니다. Vercel은 자동 재배포됩니다.

## 중요: 현재 구현 범위
이 버전은 모든 화면과 흐름을 실제로 눌러볼 수 있는 실행형 프로토타입입니다. 데이터는 브라우저 LocalStorage에 저장되므로 같은 기기·브라우저에서 동작합니다.

여러 손님이 서로의 사진·댓글·레시피·글귀를 실제로 공유하고 관리자 로그인을 안전하게 운영하려면 다음 업데이트에서 Supabase 같은 서버 DB, 이미지 저장소, 인증 및 보안 규칙 연결이 필수입니다.

## V2.1 수정
- 네온 로고 교체
- 로고가 희미함 → 선명함 → 희미함으로 호흡하는 스플래시 연출
- 사이 스친 우리 삭제
- 당신의 사이 시그니처 첫 번째 배치
- 5단계 커스텀 빌더: 기주 → 리큐르 → 맛 → 도수 → 가격
- 최소 가격 14,000원 및 선택 원가 기반 자동 권장가
- 예상 맛, 예상 도수, AI 총평, 사장님 추천, 랜덤 추천
- 관리자 화면에 커스텀 칵테일 예상 원가·가격 표시


## V2.3 업데이트
- 당신의 사이 9단계 빌더: 기주 → 리큐르 → 음료 → 맛 → 향 → 잔 → 얼음 → 가니쉬 → 완성
- 각 개별 술 최대 2oz, 서로 다른 술은 복수 선택 가능
- 기주 도합 2oz 내외 및 리큐르 도합 1~2oz 선택 가이드
- 잔의 남은 용량에 맞춘 믹서 자동 계산
- 실제 선택량·ABV·얼음 희석률 기반 예상 도수 계산
- 잔 용량 초과 경고와 추천 잔 안내
- 예상 맛·색·가격, 밸런스 점수, AI 사장 총평
- 레시피 이름·이야기 저장 및 커뮤니티 공유
- 최신 시그니처 가격과 문구 반영


## V2.5 참여·주문 전환 UX 개선
- 홈에 이미지형 빠른 시작 카드와 실시간 인기 콘텐츠
- 메뉴 검색, 맛 필터, 랜덤 추천, 추천 메뉴 강조
- 당신의 사이 추천 프리셋과 모바일 실시간 요약
- 커뮤니티 사진 업로드·미리보기, 인기 의견, 정렬, 인라인 댓글
- 사이의 추억 피드/그리드 전환, 해시태그, 사진 미리보기, 인라인 댓글
- 게시물과 추억 공유 기능 개선
- 모바일 하단 시트형 글쓰기 화면


# V2.6 — 무료 QR 테이블 주문 + 실시간 직원 주문판

## 새로 추가된 파일
- `staff.html` : 직원용 실시간 주문판
- `qr.html` : 1~14번 자리 QR 생성·인쇄
- `supabase-config.js` : 무료 Supabase 연결 정보 입력
- `supabase-orders.sql` : 주문 DB·보안 정책·Realtime 설정
- `staff.js` : 직원 알림음·주문 상태 처리

## 손님 사용 흐름
1. `https://배포주소/?table=3` 형태의 QR 촬영
2. 사이트 상단에 `3번 자리` 표시
3. 메뉴의 `주문에 담기`
4. 주문 확인 → 요청사항 → 주문 보내기
5. 직원 주문판에 즉시 신규 주문 표시

## 직원 사용 흐름
- 영업 전 `https://배포주소/staff.html` 실행
- 아이폰/태블릿 화면을 켜두기
- 처음 한 번 `알림음 테스트`를 눌러 브라우저의 소리 재생 권한 활성화
- 신규 주문: 알림음 + 진동 + 상단 큰 배너
- `접수하기 → 제조 시작 → 준비 완료 → 제공 완료`

## 실제 연결 5단계
1. Supabase 무료 프로젝트 생성
2. SQL Editor에서 `supabase-orders.sql` 전체 실행
3. Authentication → URL Configuration에서 배포 주소 등록
4. `supabase-config.js`에 Project URL과 publishable key 입력
5. SQL Editor에서 아래 이메일을 실제 직원 이메일로 등록

```sql
insert into public.staff_emails(email)
values ('직원이메일@example.com')
on conflict (email) do nothing;
```

## QR 만들기
배포 후 `/qr.html` 접속 → 사이트 주소와 14석 입력 → 인쇄하기.

## 테스트 모드
Supabase 설정 전에도 같은 브라우저에서 고객 주문과 직원 주문판을 시험할 수 있습니다.
실제 여러 기기 간 주문 전달에는 Supabase 연결이 필수입니다.


# V2.9 QR FIX
- QR 생성 버튼 무반응 원인: 기존 qr.html의 잘못 이스케이프된 정규식 때문에 inline JavaScript 전체가 실행되지 않던 문제 수정.
- 외부 QR CDN 의존 제거: 1~14번 자리 QR 이미지를 프로젝트에 로컬 포함.
- iPhone 한 대에서도 테스트 가능하도록 각 QR 카드에 '이 자리로 테스트 열기' 버튼 추가.


# V3.1 Integrated Update
- 전체 프로젝트 ZIP 통합본
- QR 생성 페이지를 단일파일 V3.0 방식으로 교체
- 당신의 사이: 13,000원 / 기주 2oz + 리큐르 2oz + 음료 기본 포함
- 초과분 추가요금 로직: 기주 +1,000원/0.5oz, 리큐르 +500원/0.5oz (data.json customBuilder.pricing에서 조정 가능)
- 리큐르/음료 목록 사용자 지정 목록으로 정리
- 메뉴 검색: 공백/부호 무시 + 검색어 중 연속 2글자만 맞아도 검색
- 메뉴명/가격은 Gmarket Sans, 맛/설명/도수/본문은 Wanted Sans 중심으로 재설계


# V3.2 QR FINAL
- qr.html 단일 파일 내부에 1~14번 QR 이미지를 base64로 완전 내장.
- 외부 QR CDN/라이브러리 의존 없음.
- 페이지 접속 즉시 1~14번 QR 자동 생성.
- QR 다시 생성 버튼, 좌석수 변경, 인쇄, 자리별 주문 테스트 링크 제공.


# V3.3 ORDER FIX
- QR 자리 인식 성공 후 주문 전송 실패 문제 수정.
- 원인: 손님 RLS는 INSERT만 허용하는데 기존 프론트가 INSERT 직후 `.select(...).single()`까지 요청하여 SELECT 정책에서 실패로 처리될 수 있었음.
- 주문 UUID를 브라우저에서 먼저 생성한 뒤 INSERT만 실행하도록 변경.
- 실패 시 실제 Supabase 오류 메시지를 팝업에 표시하여 추가 진단 가능.
- supabase-orders.sql을 V3.3 정책과 맞춰 정리.


# V3.4.1 FIX
- 승인된 홈 UI를 실제 index.html에 적용
- 승인된 메뉴/검색 UI를 실제 index.html에 적용
- 당신의 사이 음료 선택 클릭 상태/선택 정보 표시 수정
- 예상 가격은 무조건 13,000원 이상, 2oz 초과분이 있을 때만 증가
- CSS/JS cache-busting 적용 (?v=341)
- QR/Supabase 주문/직원판 코드는 변경하지 않음


## V3.4.2 hotfix
- localStorage stale customBuilder/menu config migration: deployed data.json is now source of truth.
- mixers fixed to: 토닉, 탄산수, 오렌지 주스, 크랜베리주스, 콜라, 레몬주스, 음료 없음.
- YOUR SAI minimum price hard-clamped to 13,000원.
- pricing rule: base 2oz + liqueur 2oz included; base +1,000원/0.5oz; liqueur +500원/0.5oz.
- mixer/ingredient selection uses delegated click handling for iOS Safari reliability.
- customer-visible price breakdown shows only surcharge, never bottle cost.


## V3.4.4 mixer selection hotfix
- Fixed YOUR SAI mixer tap crash: UI key `mixer` now correctly reads from `customBuilder.mixers`.
- Mixer selection now reaches existing selected-state, info, ABV/flavor update logic.
- Pricing rules from V3.4.3 unchanged.
- Supabase/order/staff flow unchanged.

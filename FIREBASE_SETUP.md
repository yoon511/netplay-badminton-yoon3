# Firebase 보안 규칙 설정 가이드

## 📋 보안 규칙 파일

프로젝트에는 두 가지 보안 규칙 파일이 있습니다:

1. **`database.rules.json`** - 개발용 (모든 사용자 읽기/쓰기 허용)
2. **`database.rules.production.json`** - 프로덕션용 (인증된 사용자만 쓰기 허용)

## 🔧 Firebase Console에서 규칙 적용하기

### 1단계: Firebase Console 접속
1. https://console.firebase.google.com/ 접속
2. 프로젝트 선택: `netplay-badminton-yoon`

### 2단계: Realtime Database로 이동
1. 왼쪽 메뉴에서 **"Realtime Database"** 클릭
2. 상단 탭에서 **"규칙"** 탭 클릭

### 3단계: 규칙 복사 및 붙여넣기

#### 개발 중 (현재 권장):
`database.rules.json` 파일의 내용을 복사하여 Firebase Console의 규칙 편집기에 붙여넣기:

```json
{
  "rules": {
    "players": {
      ".read": true,
      ".write": true
    },
    "courts": {
      ".read": true,
      ".write": true
    },
    "waitingQueues": {
      ".read": true,
      ".write": true
    }
  }
}
```

#### 프로덕션 배포 시:
`database.rules.production.json` 파일의 내용을 사용하세요. (Firebase Authentication 설정 필요)

### 4단계: 규칙 게시
1. **"게시"** 버튼 클릭
2. 확인 대화상자에서 **"게시"** 확인

## 🔒 보안 규칙 설명

### 개발용 규칙 (`database.rules.json`)
- ✅ **읽기**: 모든 사용자 허용 (실시간 동기화 필요)
- ✅ **쓰기**: 모든 사용자 허용 (개발 편의성)

### 프로덕션용 규칙 (`database.rules.production.json`)
- ✅ **읽기**: 모든 사용자 허용 (실시간 동기화 필요)
- 🔐 **쓰기**: 인증된 사용자만 허용 (`auth != null`)
- ✅ 데이터 검증 규칙 포함

## ⚠️ 주의사항

1. **개발 중**: `database.rules.json` 사용 권장
2. **프로덕션**: `database.rules.production.json` 사용 + Firebase Authentication 설정 필요
3. 보안 규칙 변경 후 즉시 적용됩니다
4. 규칙 테스트는 Firebase Console의 "규칙 시뮬레이터"에서 가능합니다

## 🚀 다음 단계 (프로덕션 배포 시)

프로덕션 환경에서는 다음을 고려하세요:

1. **Firebase Authentication 활성화**
   - Firebase Console > Authentication > Sign-in method
   - 원하는 인증 방법 활성화 (예: 익명 인증, 이메일/비밀번호)

2. **앱에 인증 추가**
   - `lib/firebase.ts`에 인증 초기화 코드 추가
   - 관리자만 쓰기 권한 부여

3. **보안 규칙 업데이트**
   - `database.rules.production.json` 사용
   - 필요시 더 세밀한 권한 제어 추가


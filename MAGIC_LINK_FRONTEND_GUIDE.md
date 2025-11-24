# 매직링크 프론트엔드 연동 가이드

## 📋 개요

매직링크 인증은 다음과 같은 흐름으로 동작합니다:

```
1. 사용자가 이메일 입력
   ↓
2. 백엔드에서 매직링크 이메일 발송
   ↓
3. 사용자가 이메일의 링크 클릭
   ↓
4. 프론트엔드 페이지 로드 (토큰 포함)
   ↓
5. 프론트엔드에서 백엔드 verify-api 호출
   ↓
6. 세션 쿠키 설정 완료
   ↓
7. 로그인 완료
```

## 🔗 이메일 링크 형식

이메일에 포함되는 링크:
```
https://your-frontend-url.com/?token=xxxx-xxxx-xxxx
```

## 💻 프론트엔드 구현

### 1. URL에서 토큰 추출

```javascript
// URL에서 토큰 파라미터 추출
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  // 토큰이 있으면 인증 처리
  verifyMagicLink(token);
}
```

### 2. 백엔드 verify-api 호출

```javascript
async function verifyMagicLink(token) {
  try {
    const BACKEND_URL = 'https://vanillajs-todolist-noframeworks-be.onrender.com';
    
    // ⚠️ 중요: credentials: 'include' 필수!
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-api?token=${token}`, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함 (필수!)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '인증에 실패했습니다.');
    }

    const data = await response.json();
    
    // 인증 성공
    console.log('로그인 성공:', data);
    
    // 토큰 파라미터 제거 (보안)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 로그인 상태 업데이트
    // 예: 로그인 상태 업데이트, 리다이렉트 등
    window.location.href = '/'; // 또는 로그인 후 이동할 페이지
    
  } catch (error) {
    console.error('매직링크 인증 실패:', error);
    alert('인증에 실패했습니다. 다시 시도해주세요.');
    // 에러 처리
  }
}
```

### 3. axios 사용 시

```javascript
import axios from 'axios';

// axios 기본 설정
axios.defaults.withCredentials = true; // 쿠키 포함 (필수!)

async function verifyMagicLink(token) {
  try {
    const BACKEND_URL = 'https://vanillajs-todolist-noframeworks-be.onrender.com';
    
    const response = await axios.get(`${BACKEND_URL}/api/auth/verify-api`, {
      params: { token },
      withCredentials: true, // 쿠키 포함 (필수!)
    });

    console.log('로그인 성공:', response.data);
    
    // 토큰 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 로그인 후 처리
    window.location.href = '/';
    
  } catch (error) {
    console.error('매직링크 인증 실패:', error);
    alert(error.response?.data?.message || '인증에 실패했습니다.');
  }
}
```

## 🔐 세션 확인

로그인 후 사용자 정보 확인:

```javascript
async function getCurrentUser() {
  try {
    const BACKEND_URL = 'https://vanillajs-todolist-noframeworks-be.onrender.com';
    
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함 (필수!)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('로그인이 필요합니다.');
    }

    const user = await response.json();
    return user;
    
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
}
```

## ⚠️ 주의사항

1. **`credentials: 'include'` 필수**: 모든 API 호출에 반드시 포함해야 세션 쿠키가 전송됩니다.

2. **CORS 설정**: 백엔드에서 프론트엔드 도메인을 CORS에 허용해야 합니다.

3. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS를 사용해야 합니다.

4. **토큰 보안**: 인증 후 URL에서 토큰 파라미터를 제거하세요.

## 📝 전체 예시 코드

```javascript
// 페이지 로드 시 실행
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    verifyMagicLink(token);
  }
});

async function verifyMagicLink(token) {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'https://vanillajs-todolist-noframeworks-be.onrender.com';
    
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-api?token=${token}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '인증에 실패했습니다.');
    }

    const data = await response.json();
    console.log('로그인 성공:', data);
    
    // 토큰 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // 로그인 상태 업데이트
    updateAuthState(true);
    
    // 홈으로 이동
    window.location.href = '/';
    
  } catch (error) {
    console.error('매직링크 인증 실패:', error);
    alert('인증에 실패했습니다. 다시 시도해주세요.');
    
    // 로그인 페이지로 이동
    window.location.href = '/login';
  }
}

function updateAuthState(isAuthenticated) {
  // 로그인 상태 업데이트 로직
  // 예: 상태 관리 라이브러리, 로컬 스토리지 등
}
```

## 🔗 API 엔드포인트

### GET /api/auth/verify-api

매직링크 토큰을 검증하고 세션을 생성합니다.

**쿼리 파라미터:**
- `token` (required): 매직링크 토큰

**응답:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-11-24T00:00:00.000Z"
  }
}
```

**에러 응답:**
```json
{
  "statusCode": 401,
  "message": "유효하지 않거나 만료된 토큰입니다.",
  "error": "Unauthorized"
}
```

### GET /api/auth/me

현재 로그인한 사용자 정보를 조회합니다.

**응답:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "createdAt": "2025-11-24T00:00:00.000Z"
}
```

**에러 응답:**
```json
{
  "statusCode": 401,
  "message": "로그인이 필요합니다.",
  "error": "Unauthorized"
}
```


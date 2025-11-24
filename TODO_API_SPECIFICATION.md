# Todo API 명세서

## 📋 기본 정보

- **Base URL**: `https://vanillajs-todolist-noframeworks-be.onrender.com/api/todo`
- **인증**: 세션 쿠키 기반 (모든 요청에 `credentials: 'include'` 필요)
- **Content-Type**: `application/json`

## 🔗 엔드포인트 목록

### 1. 전체 Todo 조회

**GET** `/api/todo`

#### 요청
```http
GET /api/todo HTTP/1.1
Host: vanillajs-todolist-noframeworks-be.onrender.com
Cookie: sessionId=xxx
```

#### 성공 응답 (200 OK)
```json
[
  {
    "id": 1,
    "creation": "2025-11-24T00:00:00.000Z",
    "deadLine": "2025-11-30T00:00:00.000Z",
    "isDone": "N",
    "content": "할 일 내용"
  },
  {
    "id": 2,
    "creation": "2025-11-24T01:00:00.000Z",
    "deadLine": "2025-12-01T00:00:00.000Z",
    "isDone": "Y",
    "content": "완료된 할 일"
  }
]
```

#### 에러 응답

**500 Internal Server Error** (DB 오류)
```json
{
  "statusCode": 500,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo",
  "message": "Internal server error"
}
```

---

### 2. 특정 Todo 조회

**GET** `/api/todo/:id`

#### 요청
```http
GET /api/todo/1 HTTP/1.1
Host: vanillajs-todolist-noframeworks-be.onrender.com
Cookie: sessionId=xxx
```

#### 성공 응답 (200 OK)
```json
{
  "id": 1,
  "creation": "2025-11-24T00:00:00.000Z",
  "deadLine": "2025-11-30T00:00:00.000Z",
  "isDone": "N",
  "content": "할 일 내용"
}
```

#### 에러 응답

**404 Not Found** (Todo가 존재하지 않음)
```json
{
  "statusCode": 404,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/999",
  "message": "Todo not found"
}
```

**500 Internal Server Error** (DB 오류)
```json
{
  "statusCode": 500,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/1",
  "message": "Internal server error"
}
```

---

### 3. Todo 생성

**POST** `/api/todo`

#### 요청
```http
POST /api/todo HTTP/1.1
Host: vanillajs-todolist-noframeworks-be.onrender.com
Content-Type: application/json
Cookie: sessionId=xxx

{
  "content": "새로운 할 일",
  "deadLine": "2025-11-30"
}
```

#### 요청 Body (CreateTodoDto)
```typescript
{
  content: string;      // 필수, 문자열
  deadLine: string;     // 필수, ISO 8601 날짜 문자열 (예: "2025-11-30")
}
```

#### 성공 응답 (201 Created)
```json
{
  "id": 3,
  "creation": "2025-11-24T02:00:00.000Z",
  "deadLine": "2025-11-30T00:00:00.000Z",
  "isDone": "N",
  "content": "새로운 할 일"
}
```

#### 에러 응답

**400 Bad Request** (DTO 검증 실패)
```json
{
  "statusCode": 400,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo",
  "message": [
    "content must be a string",
    "deadLine must be a valid ISO 8601 date string"
  ]
}
```

**500 Internal Server Error** (DB 오류)
```json
{
  "statusCode": 500,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo",
  "message": "Internal server error"
}
```

---

### 4. Todo 수정

**PUT** `/api/todo/:id`

#### 요청
```http
PUT /api/todo/1 HTTP/1.1
Host: vanillajs-todolist-noframeworks-be.onrender.com
Content-Type: application/json
Cookie: sessionId=xxx

{
  "content": "수정된 할 일",
  "deadLine": "2025-12-01"
}
```

#### 요청 Body (UpdateTodoDto)
```typescript
{
  content?: string;           // 선택, 문자열
  deadLine?: string;          // 선택, ISO 8601 날짜 문자열
  completed?: boolean;        // 선택, 불리언 (현재 사용되지 않음)
}
```

#### 성공 응답 (200 OK)
```json
{
  "id": 1,
  "creation": "2025-11-24T00:00:00.000Z",
  "deadLine": "2025-12-01T00:00:00.000Z",
  "isDone": "N",
  "content": "수정된 할 일"
}
```

#### 에러 응답

**400 Bad Request** (DTO 검증 실패)
```json
{
  "statusCode": 400,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/1",
  "message": [
    "content must be a string",
    "deadLine must be a valid ISO 8601 date string"
  ]
}
```

**404 Not Found** (Todo가 존재하지 않음)
```json
{
  "statusCode": 404,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/999",
  "message": "Todo not found"
}
```

**500 Internal Server Error** (DB 오류)
```json
{
  "statusCode": 500,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/1",
  "message": "Internal server error"
}
```

---

### 5. Todo 삭제

**DELETE** `/api/todo/:id`

#### 요청
```http
DELETE /api/todo/1 HTTP/1.1
Host: vanillajs-todolist-noframeworks-be.onrender.com
Cookie: sessionId=xxx
```

#### 성공 응답 (200 OK)
```json
{
  "raw": [],
  "affected": 1
}
```

#### 에러 응답

**404 Not Found** (Todo가 존재하지 않음)
```json
{
  "statusCode": 404,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/999",
  "message": "Todo not found"
}
```

**500 Internal Server Error** (DB 오류)
```json
{
  "statusCode": 500,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/1",
  "message": "Internal server error"
}
```

---

### 6. Todo 완료 토글

**PATCH** `/api/todo/:id/toggle`

#### 요청
```http
PATCH /api/todo/1/toggle HTTP/1.1
Host: vanillajs-todolist-noframeworks-be.onrender.com
Cookie: sessionId=xxx
```

#### 성공 응답 (200 OK)
```json
{
  "id": 1,
  "creation": "2025-11-24T00:00:00.000Z",
  "deadLine": "2025-11-30T00:00:00.000Z",
  "isDone": "Y",
  "content": "할 일 내용"
}
```

#### 에러 응답

**404 Not Found** (Todo가 존재하지 않음)
```json
{
  "statusCode": 404,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/999/toggle",
  "message": "Todo not found"
}
```

**500 Internal Server Error** (DB 오류)
```json
{
  "statusCode": 500,
  "timestamp": "2025-11-24T00:00:00.000Z",
  "path": "/api/todo/1/toggle",
  "message": "Internal server error"
}
```

---

## 📊 에러 상태 코드 요약

| 상태 코드 | 의미 | 발생 상황 |
|----------|------|----------|
| **200 OK** | 성공 | 조회, 수정, 삭제, 토글 성공 |
| **201 Created** | 생성 성공 | Todo 생성 성공 |
| **400 Bad Request** | 잘못된 요청 | DTO 검증 실패 (필수 필드 누락, 타입 불일치 등) |
| **404 Not Found** | 리소스 없음 | 존재하지 않는 Todo ID로 조회/수정/삭제 시도 |
| **500 Internal Server Error** | 서버 오류 | DB 연결 오류, TypeORM 오류 등 |

## 🔐 인증

모든 Todo API는 세션 쿠키 기반 인증을 사용합니다.

### 프론트엔드 요청 예시

```javascript
// fetch 사용
fetch('https://vanillajs-todolist-noframeworks-be.onrender.com/api/todo', {
  method: 'GET',
  credentials: 'include', // ⚠️ 필수!
  headers: {
    'Content-Type': 'application/json',
  },
});

// axios 사용
axios.defaults.withCredentials = true; // ⚠️ 필수!
axios.get('https://vanillajs-todolist-noframeworks-be.onrender.com/api/todo');
```

## 📝 데이터 타입

### Todo Entity
```typescript
{
  id: number;                    // 자동 증가 ID
  creation: Date;                // 생성일시 (자동 생성)
  deadLine: Date;                 // 마감일 (ISO 8601 날짜)
  isDone: 'Y' | 'N';             // 완료 여부 ('Y': 완료, 'N': 미완료)
  content: string;               // 할 일 내용
}
```

### CreateTodoDto
```typescript
{
  content: string;               // 필수, 할 일 내용
  deadLine: string;              // 필수, ISO 8601 날짜 문자열 (예: "2025-11-30")
}
```

### UpdateTodoDto
```typescript
{
  content?: string;              // 선택, 할 일 내용
  deadLine?: string;             // 선택, ISO 8601 날짜 문자열
  completed?: boolean;           // 선택, 완료 여부 (현재 사용되지 않음)
}
```

## ⚠️ 주의사항

1. **인증 필수**: 모든 요청에 세션 쿠키가 필요합니다 (`credentials: 'include'` 필수)
2. **날짜 형식**: `deadLine`은 ISO 8601 형식의 날짜 문자열이어야 합니다 (예: `"2025-11-30"`)
3. **완료 상태**: `isDone`은 `'Y'` 또는 `'N'` 문자열입니다 (boolean이 아님)
4. **에러 처리**: 모든 에러는 일관된 형식으로 반환됩니다 (statusCode, timestamp, path, message)


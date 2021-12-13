# population
Visualization of the floating population

===

## 환경설정 (개발 툴 포함)
```
- java v1.8 
- node.js v12.16.2
- npm v6.14.4
- VS Code 또는 그외 Frontend 개발 툴
- Spring Tool Suite 4 
```

## 실행 및 빌드

Frontend 실행 : cd /root/population/frontend

```
- 실행
$ cd frontend
$ npm install
$ npm start

- 빌드
$ cd frontend
$ npm run build

* 개발 환경 시
  - package.json => "proxy": "http://localhost:8066" 옵션 확인. (server port와 맞는지 확인)
```

backend 실행 : spring boot tool 사용

```
- resources/application.properties 확인
   - H2 DB 경로 설정 변경 : spring.datasource.url -> {로컬 경로}
   - default port : 8066 (server.port 옵션으로 변경 가능) 

- 실행
  - population 프로젝트 => Spring Boot App으로 실행

- 빌드
  - maven build -> mvn clean install
  - target 폴더 확인
```

## 배포 및 설치

1. jar 배포 및 실행

```
 - 배포할 특정 디렉토리 생성.
 - mvn build 한 target 폴더의 모든 파일 복사.
 - $ java -jar population-0.0.1-SNAPSHOT.jar 명령어로 실행
 - http://localhost:8066 URL로 정상 동작 확인
```

2. git clone 및 serve 방법

```
 $ git clone https://github.com/bbbbbra/population.git
 $ cd population/frontend
 $ npm install
 $ npm run build
 $ serve -l 8066 -s build
 - http://localhost:8066 URL로 정상 동작 확인
```

## 사용자 영역 크기 변경 (소스코드)
```
  - cd frontend/src/component
  - ChartScript.js 34번째 code line
  - MapScript.js 1100번째 code line
  - circleRadius 변수 값 변경 => default = 2; (기본단위 Km)
```

## REST API Service

* 사용자 계정 생성

```
  - URL : localhost:{port}/api/members/create
  - http request method : POST
  - form-data
    - key value 형태
    - name : {값}, pw : {값}
```

# population
Visualization of the floating population


## 환경설정 (개발 툴 포함)
```
- java v1.8 
- node.js v12.16.2
- npm v6.14.4
- VS Code 또는 그외 Frontend 개발 툴
- Spring Tool Suite 4 
```

## 프로젝트 기본 구성
```
  * 전체
      frontend  // Client 웹 서비스 (node, npm, react 구성)
      src       // backend 서비스 : java class (로그인 처리)
      pom.xml   // maven dependencies : springframework 사용
  
  * Frontend (React App 기본 구성)
      external          // Vector Tile 서비스 시 필요한 라이브러리
      node_external     // node_module 관련 별도 커스텀한 라이브러리
      public
      src               // Web 로직
        component
          AuthenticatedRoute.jsx    // 로그인 인증 처리
          InstructorApp.jsx         // 페이지 라우터 처리
          LoginComponent.jsx        // 로그인 컴포넌트
          LogoutComponent.jsx       // 로그아웃 컴포넌트
          MenuComponent.jsx         // 최상단Bar 메뉴 컴포넌트
          MainComponent.jsx         // 지도/차트 영역 컴포넌트
          MapScript.js              // 지도기능 스크립트
          ChartScript.js            // 차트기등 스크립트
        css
        js
        redux                       // react-redux 사용 (상태 값 저장)
        service
          AuthenticationService.js  // 로그인 페이지에서 로그인 시 backend 통신 및 인증 처리 확인
          CustomFunc.js             // 지도/차트 기능에 필요한 함수들
        App.css                     // 커스텀 css 포함
        App.js
        index.css
        index.js
        server.json                 // HTTP API 서버에 Connect 하기 위한 정보
        serviceWorker.js
      package.json                  // npm, node 관련 설정
      
```
## 빌드 및 실행
### 1) npm 사용

Frontend 실행 : cd /root/population/frontend

```
- 실행
$ cd frontend
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

### 2) jar 사용

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

## HTTP API 서버 설정 확인

* VectorTile 및 Chart 데이터를 가져오기 위한 접속 정보

```
  경로 : cd population/frontend/src
  접속정보 : server.json 파일 확인
  
  {
    "user": "ltdb",
    "password": "ltdb",
    "database": "default",
    "protocol": "http",
    "host": "fbg01",
    "port": [4762, 4763, 4764, 4765, 4766, 4767, 4768, 4769, 4770, 4771, 4772, 4773]
  }
  
```

## HTTP API 사용하기 위한 관련 테이블 정보
  
  * 테이블 DDL CREATE 관련해서는 HTTP API 서버 README 참고.
  
```
  * ltdb_fp 테이블 : 유동인구 데이터 (지도/차트 구현 시 사용)
  
  CREATE table ltdb_fp (
    adm_code string,
    x double,
    y double,
    recordid integer,
    block_cd long,
    exist_m_00 double,
    exist_m_10 double,
    exist_m_20 double,
    exist_m_30 double,
    exist_m_40 double,
    exist_m_50 double,
    exist_m_60 double,
    exist_m_70 double,
    exist_m_80 double,
    exist_m_90 double,
    exist_f_00 double,
    exist_f_10 double,
    exist_f_20 double,
    exist_f_30 double,
    exist_f_40 double,
    exist_f_50 double,
    exist_f_60 double,
    exist_f_70 double,
    exist_f_80 double,
    exist_f_90 double,
    home_m_00 double,
    home_m_10 double,
    home_m_20 double,
    home_m_30 double,
    home_m_40 double,
    home_m_50 double,
    home_m_60 double,
    home_m_70 double,
    home_m_80 double,
    home_m_90 double,
    home_f_00 double,
    home_f_10 double,
    home_f_20 double,
    home_f_30 double,
    home_f_40 double,
    home_f_50 double,
    home_f_60 double,
    home_f_70 double,
    home_f_80 double,
    home_f_90 double,
    work_m_00 double,
    work_m_10 double,
    work_m_20 double,
    work_m_30 double,
    work_m_40 double,
    work_m_50 double,
    work_m_60 double,
    work_m_70 double,
    work_m_80 double,
    work_m_90 double,
    work_f_00 double,
    work_f_10 double,
    work_f_20 double,
    work_f_30 double,
    work_f_40 double,
    work_f_50 double,
    work_f_60 double,
    work_f_70 double,
    work_f_80 double,
    work_f_90 double,
    in_m_00 double,
    in_m_10 double,
    in_m_20 double,
    in_m_30 double,
    in_m_40 double,
    in_m_50 double,
    in_m_60 double,
    in_m_70 double,
    in_m_80 double,
    in_m_90 double,
    in_f_00 double,
    in_f_10 double,
    in_f_20 double,
    in_f_30 double,
    in_f_40 double,
    in_f_50 double,
    in_f_60 double,
    in_f_70 double,
    in_f_80 double,
    in_f_90 double,
    geohash string,
    geometry string,
    event_time string
    )
    USING r2 OPTIONS
    (
    table '900',
    host 'fbg02',
    port '18900',
    partitions 'event_time geohash',
    mode 'nvkvs',
    rowstore 'false',
    at_least_one_partition_enabled 'no',
    group_query_enabled 'yes',
    geometry_type 'point'
  )


  * ltdb_fp_history 테이블 : 날짜별 유동인구 히스토리 테이블 (최신날짜 업데이트(캘린더)에  ) 
  
  CREATE table ltdb_fp_history (
    event_time string,
    table_name string
    )
    USING r2 OPTIONS
    (
    table '910',
    host 'fbg02',
    port '18900',
    partitions 'table_name event_time',
    mode 'nvkvs',
    rowstore 'false',
    at_least_one_partition_enabled 'no'
  )
  
```

## 사용자 영역 크기 변경 (소스코드)
```
  - cd frontend/src/component
  - ChartScript.js 34번째 code line
  - MapScript.js 1100번째 code line
  - circleRadius 변수 값 변경 => default = 2; (기본단위 Km)
```

## REST API Service
* Service 관련 source code -> population/src/main/java/kr/co/ltdb/controller/MemberController.java

* javascript 상의 테스트가 아니라면 postman(https://www.postman.com/) 설치하여, URL 테스트하면 편리합니다.

* 계정 리스트 조회
```
  - URL : localhost:{port}/api/members
  - http request method : GET
```

* 계정 조회
```
  - URL : localhost:{port}/api/members
  - http request method : GET
  - form-data
    - key value 형태
    - name : {값}  
```

* 계정 생성
```
  - URL : localhost:{port}/api/members/create
  - http request method : POST
  - form-data
    - key value 형태
    - name : {값}, pw : {값}
```



## 운영 시 필요한 가이드

1. HTTP API Connection / SQL 및 결과 확인
  * 해당 서비스는 Web(Client) 환경에서 Thrift를 통한 내용입니다. (html/javascript 구현)
```
  1) Basic Query
  - frontend/src/js 폴더의 browser-connector.js import 하여 사용
  - Input Value : String (SQL문)
  - Out Value : SQL문 결과에 대한 Json Data
  
  * MapdCon 객체를 이용한 접속 및 SQL 테스트
  
    new MapdCon() // API서버 접속
        .host("fbg01")
        .port("4762") 
        .dbName("default") 
        .user("ltdb")
        .password("ltdb")
        .connectAsync()
        .then(function (connector) { // 커넥션 객체
            
            var query = "select max(event_time) from ltdb_fp_history where table_name='ltdb_fp'"; // SQL문 작성
            connector.queryAsync(query, {columnarResults: false}).then(function (result) { // 커넥션 객체를 이용한 SQL 요청
               console.log(result); // 결과 값
            });
        })  
        

  2) Vector tile Query
  * mapbox-gl api 숙지 필요
  - 관련 라이브러리 Import 필요
    - frontend/src/js 폴더의 mapbox-gl.js import 하여 사용
    - frontend/external 또는 frontend/build/static/js 폴더의 global-mercator.js, pako.js, vectortile-utils.js import 하여 사용
    
  //mapboxgl 사용하기 위한 토큰 필요
  mapboxgl.accessToken = {토큰값(String)}; //'pk.eyJ1IjoibGVlc2giLCJhIjoiY0thWXdQbyJ9.fPGnL5s0k8ptNPY7P1S1aA';
  
  //API서버에 Tile 요청 시 사용할 포트배열 필요.
  var ports = [4762, 4763, 4764, 4765, 4766, 4767, 4768, 4769, 4770, 4771, 4772, 4773];
  
  //Map 객체 생성
  var map = new mapboxgl.Map({
            container: {html div id},
            hash: true,
            style: {
                'version': 8,
                'sources': {
                    'raster-tiles': {
                        'type': 'raster',
                        'tiles': [
                            'http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                        ],
                        'tileSize': 256
                    }
                },
                'layers': [{
                    'id': 'base-map',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 22
                }]
            },
            center: [127, 37.55], //126.986, 37.565
            zoom: 11,
            maxZoom: 16,
            minZoom: 8.5,
            tilesFunctionParams: function (tile) { // 커스텀 함수 : tile 요청 시 여러 port로 요청하기 위한 설정
                const port = ports.shift();
                ports.push(port);
    
                return {
                    host: config.host,
                    port: port,
                    eventTime1: null,
                    eventTime2: null
                }
            }            
            //interactive: false
   });  
   
   //Map load 및 필요 라이브러리 가져오기
   //Vector layer 생성
   map.on('load', function() {
      map.style.dispatcher.broadcast('loadWorkerSource', { //broadcast를 이용한 라이브러리 import
          name: "pako",
          url: `http://${window.location.host}/static/js/pako.js`
      }, function (e) {
          if (e) {
              console.log(e);
          }
      });   
      
      map.style.dispatcher.broadcast('loadWorkerSource', {
          name: "global-mercator",
          url: `http://${window.location.host}/static/js/global-mercator.js`
      }, function (e) {
          if (e) {
              console.log(e);
          }
      });  
      
      map.style.dispatcher.broadcast('loadWorkerSource', {
          name: "vectortile-utils",
          url: `http://${window.location.host}/static/js/vectortile-utils.js`
      }, function (e) {
          if (e) {
              console.log(e);
          }
      });      
      
      //Vector Source 생성
      //renderSqlPost 함수 : SQL문 하나만 요청하여 결과값 리턴 ( ex)현재 유동인구 표현 시 사용 )
      map.addSource('vector-tile', {
          type: 'vector',
          tilesFunction: `function (tile) { // 커스텀 함수
                  var host = tile.tilesFunctionParams.host;
                  var port = tile.tilesFunctionParams.port;  

                  var sql = ""; //데이터를 가져올 Query문 작성
                  var typeName = "ltdb_fp";
                  var aggrType = "sum";
                  var multiple = false;
                  return renderSqlPost(host, port, tile, sql, typeName, aggrType, multiple, null);
              }`,
          minzoom: 0,
          maxzoom: 16.1
      });      
      
      //증감 유동인구 데이터 가져올 때 사용하는 함수
      * 하나의 예이므로 같은 map객체 사용.
      //renderSqlDiffPost 함수 : SQL문 2가지 요청하여 subtract한 결과값 리턴 ( ex)증감 유동인구 표현 시 사용 )
      map.addSource('vector-tile', {
          type: 'vector',
          tilesFunction: `function (tile) { // 커스텀 함수
                  var host = tile.tilesFunctionParams.host;
                  var port = tile.tilesFunctionParams.port;  
                  
                  //컬럼 별 subtract은 sql1 - sql2 
                  var sql1 = ""; //기준 데이터를 가져올 Query문 작성
                  var sql2 = ""; //비교 데이터를 가져올 Query문 작성
                  var typeName = "ltdb_fp";
                  var aggrType = "sum";
                  var multiple = false;
                  return renderSqlDiffPost(host, port, tile, sql1, sql2, typeName, aggrType, multiple, null);
              }`,
          minzoom: 0,
          maxzoom: 16.1
      });          
      
      //Vector Layer 생성
      map.addLayer({...});
   
   });
```

2. 구현된 Source의 HTTP API Service 사용 확인
  
  - 캘린더 관련하여, ltdb_fp_history 테이블의 최신 날짜 Query
  ```
    - 소스 경로 : frontend/src/component/MenuComponent.jsx
    - 69번째 라인 확인
    - 사용 SQL 
      - "select max(event_time) from ltdb_fp_history where table_name='ltdb_fp' limit 1"
  ```
  
  - Vector Tile Query
  ```
    - 소스 경로 : frontend/src/component/MenuComponent.jsx
    
    1) 92번째 라인 확인
    - 사용 SQL 
      - "SELECT (exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist, geometry FROM ltdb_fp WHERE event_time = '${currPrevDateString.curr}'"
    
    2) 192번째 라인 확인
      - "SELECT (exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist, geometry FROM ltdb_fp WHERE event_time = '${currPrevDateString.curr}'"; //현재 날짜
      - "SELECT (exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist, geometry FROM ltdb_fp WHERE event_time = '${currPrevDateString.prev}'"; //이전 날짜

  ```
  
  - Chart Query
  ```
    - 소스 경로 : frontend/src/service/CustomFunc.jsx
    
    1) 막대차트 - 현재날짜 데이터 가져오기. 329번째 라인 확인
      - `SELECT
            (sum(exist_m_00) + sum(exist_m_10)) as exist_m_10, sum(exist_m_20) as exist_m_20, sum(exist_m_30) as exist_m_30,
            sum(exist_m_40) as exist_m_40, sum(exist_m_50) as exist_m_50, (sum(exist_m_60) + sum(exist_m_70) +
            sum(exist_m_80) + sum(exist_m_90)) as exist_m_60,
            (sum(exist_f_00) + sum(exist_f_10)) as exist_f_10, sum(exist_f_20) as exist_f_20, sum(exist_f_30) as exist_f_30,
            sum(exist_f_40) as exist_f_40, sum(exist_f_50) as exist_f_50, (sum(exist_f_60) + sum(exist_f_70) +
            sum(exist_f_80) + sum(exist_f_90)) as exist_f_60, event_time        
        FROM ltdb_fp    
        WHERE ST_CONTAINS(ST_GEOMFROMTEXT('${wkt}'), geometry) AND event_time = '${eventTime1}'
        GROUP BY event_time ORDER BY event_time`
        
     1) 라인차트 - 24시간 기준 시간 별 데이터 가져오기. 341번째 라인 확인   
       - `SELECT
            (sum(exist_m_00) + sum(exist_m_10)) as exist_m_10, sum(exist_m_20) as exist_m_20, sum(exist_m_30) as exist_m_30,
            sum(exist_m_40) as exist_m_40, sum(exist_m_50) as exist_m_50, (sum(exist_m_60) + sum(exist_m_70) +
            sum(exist_m_80) + sum(exist_m_90)) as exist_m_60,
            (sum(exist_f_00) + sum(exist_f_10)) as exist_f_10, sum(exist_f_20) as exist_f_20, sum(exist_f_30) as exist_f_30,
            sum(exist_f_40) as exist_f_40, sum(exist_f_50) as exist_f_50, (sum(exist_f_60) + sum(exist_f_70) +
            sum(exist_f_80) + sum(exist_f_90)) as exist_f_60,
            substring(event_time, 0, ${eventTimeFormat.length - 2}) as event_time
        FROM ltdb_fp
        WHERE ST_CONTAINS(ST_GEOMFROMTEXT('${wkt}'), geometry) AND event_time IN(${QueryTimeArray.toString()})  GROUP BY event_time ORDER BY event_time`;
  ```

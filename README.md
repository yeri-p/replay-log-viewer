# RE:PLAY — 로컬 TRPG 로그 뷰어

React + TypeScript + Vite. JSON 하나에서 대사, 이미지, 주사위 결과를 읽습니다.
파일은 서버에 전송하지 않으며 새로고침하면 초기화됩니다.

## 실행
Node.js 22.18 이상에서:
```sh
npm install
npm run dev
```

## 사용
JSON 하나를 선택하거나 화면에 끌어놓습니다.
각 대사의 iconImage 값을 최상위 images 객체의 키와 연결합니다.
같은 캐릭터도 메시지별로 다른 스탠딩을 표시합니다.
캐릭터별 이미지 수동 지정은 필요하지 않습니다.
채팅의 '여기서 재생' 버튼으로 해당 대사부터 시작합니다.
클릭 / Space로 텍스트 완성 및 다음 대사, 방향키로 이전·다음, Esc로 닫기.
재생 화면에서는 스탠딩 전체가 보이도록 비율을 유지합니다.
extend.roll.result를 원문 그대로 표시하고 성공/실패/critical/fumble을 구분합니다.
이미지가 없거나 로드에 실패하면 이니셜을 표시합니다.

## 입력 형식
```json
{
  "messages": [
    {
      "name": "라일",
      "text": "테스트",
      "iconImage": "image-key",
      "extend": { "roll": { "result": "44 ＞ 보통 성공", "success": true } }
    }
  ],
  "images": {
    "image-key": "data:image/png;base64,..."
  }
}
```
위 base64 생략값은 설명용입니다. 실제 JSON에는 완전한 이미지 데이터가 필요합니다.
PNG/JPEG/WEBP/GIF base64 이미지만 표시합니다. 외부 URL은 요청하지 않습니다.
최대 파일 크기 100MB, 메시지 50,000개. 큰 파일은 브라우저 메모리와 파싱 시간이 많이 필요합니다.

## 검증
```sh
npm test
npm run build
```

## GitHub Pages
프로젝트를 저장소 main 브랜치에 올립니다.
Settings → Pages → Build and deployment에서 GitHub Actions를 선택합니다.
main push 시 포함된 .github/workflows/pages.yml이 테스트, 빌드 및 배포합니다.
base: './' 설정으로 저장소 하위 경로를 지원합니다.
개인 로그는 저장소에 넣지 마세요.

## 이번 변경 검증
제공된 JSON 발췌 구조로 메시지별 이미지 전환, 주사위 결과, 누락 이미지 및 잘못된 입력을 테스트합니다.
실제 전체 첨부 JSON 및 원본 디자인 이미지 대조는 미완료입니다.

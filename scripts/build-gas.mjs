// 화면(React)을 HTML 파일 하나로 묶어서 apps-script/Index.html 로 만들어요.
// 구글 Apps Script 는 파일을 여러 개 서빙하기 어려워서, CSS·JS 를 전부 안에 넣어요.
// 실행: npm run build:gas
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const assets = readdirSync('dist/assets');
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');

if (js.includes('</script')) throw new Error('JS 안에 </script 글자가 있어서 한 파일로 묶을 수 없어요.');
if (/\bimport\.meta\b|^\s*(import|export)\s/m.test(js)) throw new Error('JS 가 모듈 문법을 써서 일반 <script>로 넣을 수 없어요.');

const html = `<!doctype html>
<html lang="ko">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>제품 일정 캘린더</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap">
<style>
${css}
</style>
</head>
<body>
<div id="root"></div>
<script>
${js}
</script>
</body>
</html>
`;
writeFileSync('apps-script/Index.html', html);
console.log(`apps-script/Index.html 만들었어요 (${Math.round(html.length / 1024)} KB)`);

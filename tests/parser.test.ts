import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLog } from '../src/parser.ts';
const a = 'data:image/png;base64,AAAA', b = 'data:image/png;base64,BBBB';
test('same speaker uses each message image, including direct playback start', () => {
 const result = parseLog({messages:[{name:'라일',text:'테스트',iconImage:'a'},{name:'라일',text:'하하',iconImage:'b'},{name:'라일',text:'다시',iconImage:'a'}],images:{a,b}});
 assert.deepEqual(result.map(m=>m.image),[a,b,a]);
});
test('dice outcome and complete result are preserved',()=>{
 const result = '(1D100<=50) 보너스, 페널티 주사위[0] ＞ 44 ＞ 44 ＞ 보통 성공';
 const [m]=parseLog({messages:[{text:'CC<=50 근력',extend:{roll:{result,success:true,failure:false}}}]});
 assert.equal(m.roll?.result,result); assert.equal(m.roll?.outcome,'success');
});
test('special outcomes take precedence',()=>{
 for(const [flags,expected] of [[{critical:true,success:true},'critical'],[{fumble:true,failure:true},'fumble'],[{failure:true},'failure'],[{},'neutral']] as const){
 assert.equal(parseLog([{text:'roll',extend:{roll:{result:'result',...flags}}}])[0].roll?.outcome,expected);
 }
});
test('missing images do not inherit an earlier standing',()=>{
 const r=parseLog({messages:[{text:'one',iconImage:'a'},{text:'two',iconImage:'missing'},{text:'three'}],images:{a}});
 assert.equal(r[0].image,a);assert.equal(r[1].image,undefined);assert.equal(r[2].image,undefined);
});
test('external urls and active image formats are not loaded',()=>{
 for(const value of ['https://example.com/img.png','javascript:alert(1)','data:image/svg+xml;base64,AAAA']){
 assert.equal(parseLog({messages:[{text:'test',iconImage:'a'}],images:{a:value}})[0].image,undefined);
 }
});
test('invalid input is rejected and roll-only messages survive',()=>{
 for(const v of [null,{},[],{messages:[{text:3}]}]) assert.throws(()=>parseLog(v));
 assert.equal(parseLog([{text:'',extend:{roll:{result:'44'}}}]).length,1);
});
test('order, channel, text and fallback color remain intact',()=>{
 const [m]=parseLog([{name:'KP',text:'<script>\nnext',type:'system',channelName:'메인',color:'url(x)'}]);
 assert.equal(m.text,'<script>\nnext'); assert.equal(m.channel,'메인');assert.equal(m.color,'#657968');assert.equal(m.system,true);
});

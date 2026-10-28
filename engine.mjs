export const cards={
 'sub1':{label:'양쪽에서 1 빼기',kind:'add',n:-1},'sub2':{label:'양쪽에서 2 빼기',kind:'add',n:-2},'sub3':{label:'양쪽에서 3 빼기',kind:'add',n:-3},'sub4':{label:'양쪽에서 4 빼기',kind:'add',n:-4},'add3':{label:'양쪽에 3 더하기',kind:'add',n:3},
 'div2':{label:'양쪽을 2로 나누기',kind:'div',n:2},'div3':{label:'양쪽을 3으로 나누기',kind:'div',n:3},'div4':{label:'양쪽을 4로 나누기',kind:'div',n:4},'divN2':{label:'양쪽을 −2로 나누기',kind:'div',n:-2},'mul2':{label:'양쪽에 2 곱하기',kind:'mul',n:2},'subX':{label:'양쪽에서 x 빼기',kind:'x',n:-1}
};
export function transform(eq,card){if(!card||!Number.isFinite(card.n)||(card.kind==='div'&&card.n===0))throw Error('0으로 나눌 수 없어요.');const [a,b,c,d]=eq,n=card.n;switch(card.kind){case 'add':return[a,b+n,c,d+n];case 'x':return[a+n,b,c+n,d];case 'mul':return eq.map(x=>x*n);case 'div':return eq.map(x=>x/n);default:throw Error('알 수 없는 연산');}}
export const root=([a,b,c,d])=>(d-b)/(a-c);
export const normalized=e=>Math.abs(e[0]-1)<1e-9&&Math.abs(e[1])<1e-9&&Math.abs(e[2])<1e-9;
export const number=n=>Number.isInteger(n)?String(n):(()=>{for(let d=2;d<=144;d++){const p=Math.round(n*d);if(Math.abs(p/d-n)<1e-8)return `${p}/${d}`;}return n.toFixed(3);})();
export function expression(a,b){return (a===0?'':a===1?'x':a===-1?'−x':number(a)+'x')+(b===0?(a===0?'0':''):a===0?number(b):b<0?' − '+number(-b):' + '+number(b));}
export const equation=e=>expression(e[0],e[1])+' = '+expression(e[2],e[3]);
export function createState(l){return {tick:0,water:l.water,stock:{...l.stock},beds:l.beds.map(b=>({...b,eq:[...b.eq],done:false,shield:false})),status:'playing',events:[]};}
export function act(l,state,action){
 if(state.status!=='playing')return {ok:false,state,message:'이번 정원은 끝났어요. 다시 시작할 수 있어요.'};
 const b=state.beds[action.bed];if(!b||b.done)return {ok:false,state,message:'아직 꽃피우지 않은 화단을 고르세요.'};
 if(b.requires!==undefined&&!state.beds[b.requires].done&&action.kind==='card')return {ok:false,state,message:`${String.fromCharCode(65+b.requires)} 화단을 먼저 꽃피워 빛을 보내주세요.`};
 const cost=action.kind==='card'?1:2;if(state.water<cost)return {ok:false,state,message:`물이 ${cost}방울 필요해요. 꽃을 피우면 3방울을 돌려받아요.`};
 if(action.kind==='card'&&(!cards[action.card]||!state.stock[action.card]))return {ok:false,state,message:'이 도구는 다 썼어요. 다른 풀이를 찾거나 되돌려보세요.'};
 if(!['card','water','shield'].includes(action.kind))return {ok:false,state,message:'사용할 행동을 고르세요.'};
 if(action.kind==='shield'&&(!l.thorns||b.shield))return {ok:false,state,message:'덮개가 필요하지 않거나 이미 씌웠어요.'};
 const s=structuredClone(state),n=s.beds[action.bed];s.water-=cost;s.tick++;s.events=[];
 if(action.kind==='card'){n.eq=transform(n.eq,cards[action.card]);s.stock[action.card]--;s.events.push(`${String.fromCharCode(65+action.bed)}: ${cards[action.card].label}`);}
 if(action.kind==='water'){n.deadline+=3;s.events.push('물 주기: 이 화단의 제한이 3차례 늘었어요.');}
 if(action.kind==='shield'){n.shield=true;s.events.push('덮개를 씌워 이 화단에 가시가 자라지 않아요.');}
 if(normalized(n.eq)&&action.kind==='card'){n.done=true;s.water+=3;s.events.push(`${String.fromCharCode(65+action.bed)} 꽃이 피었어요! 물 3방울을 얻었어요.`);}
 if(l.thorns&&s.tick%l.thorns===0)for(const bed of s.beds)if(!bed.done&&!bed.shield){bed.eq=transform(bed.eq,{kind:'add',n:1});s.events.push('가시: 덮개 없는 화단의 양쪽에 1씩 더해졌어요. 해는 그대로예요.');}
 const late=s.beds.some(b=>!b.done&&s.tick>=b.deadline);
 s.status=s.beds.every(b=>b.done)?'won':late||s.tick>=l.limit?'lost':'playing';
 return {ok:true,state:s,message:s.status==='won'?'모든 꽃이 피었어요!':late?'제한 시간이 지난 화단이 있어요. 순서를 바꾸거나 물을 줘 보세요.':s.status==='lost'?'정원의 밤이 끝났어요. 다시 계획해 보세요.':s.events.join(' ')};
}
export const C=(bed,card)=>({kind:'card',bed,card});
export const W=bed=>({kind:'water',bed});export const S=bed=>({kind:'shield',bed});
export function replay(l,plan){let state=createState(l);for(const a of plan){const r=act(l,state,a);if(!r.ok)return r;state=r.state;}return {ok:true,state};}

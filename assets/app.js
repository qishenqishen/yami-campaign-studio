'use strict';
const E=s=>String(s??'').replaceAll('；','。').replace('渠道承接从','渠道路径：').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),K=['客户需求','选品决策','创意交付','效果复盘'];
const presets=[
'为北美留学生做一次小红书茶歇拉新，希望第一次进站的人愿意下首单。主打禅意下午茶，用真实商品说明怎么搭配，不承诺折扣。',
'让北美年轻职场人在 Instagram 认识可自制的亚洲茶饮，用多巴胺食谱做品类教育。希望内容能把人带到活动页，不以点赞代替商品浏览。',
'面向北美留学生，为室友电影夜做站内活动页。目标是提升商品加购，让主推零食与分享搭配在同一个页面出现。'
];
const sceneNames={'Zen Afternoon Tea':'禅意下午茶','Dopamine Recipes':'多巴胺食谱','Indulgent Snacks':'放肆吃一回','Whole-Grain Wellness':'五谷养生汇'};
const gOpts=['新客首购','商品加购','品类认知'],chOpts=['小红书','Instagram','站内活动页'];
const roles={hero:'历史主推位',carousel:'历史轮播位',support:'历史搭配位',sale:'历史商品位',grid:'历史商品位'};
let tab=0, version=1, idSerial=0, briefOK=false, selectionOK=false, ownerQA=false, approvedIds=new Set(), advice=null, stagedAdvice=null, pinned=[];
let data={brief:presets[0],exclude:[],lock:[],verified:[],signals:{}},plan=null,history=[],change='',stamp='',noticeTimer;
function fresh(){const a=new Uint32Array(2);if(self.crypto?.getRandomValues)crypto.getRandomValues(a);else{a[0]=Date.now();a[1]=++idSerial}return 'tea-'+version+'-'+Array.from(a,n=>n.toString(36)).join('-')}
function recalc(){plan=YamiEngine.plan({...data,lock:[...new Set([...pinned,...data.lock])]},CATALOG);}
function log(s){history.unshift(s);history=history.slice(0,6);}
function toast(s){$('status').textContent=s;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('status').textContent='',3300)}
function changed(note,briefToo=false){pendingController?.abort();pendingController=null;version++;stamp=fresh();stagedAdvice=null;advice=null;pinned=[];selectionOK=false;ownerQA=false;approvedIds.clear();if(briefToo)briefOK=false;recalc();log(note);}
function take(act,label,opt=''){return '<button type="button" data-act="'+act+'" '+opt+'>'+E(label)+'</button>'}
function keybtn(act,label,cls,id){return take(act,label,'class="'+cls+'" data-id="'+E(id)+'"')}
function opts(list,sel,labels={},empty){return (empty?'<option value="">从简报中识别</option>':'')+list.map(v=>'<option value="'+E(v)+'" '+(v===sel?'selected':'')+'>'+E(labels[v]||v)+'</option>').join('')}
function box(title,body,cls=''){return '<div class="box '+cls+'"><h4>'+E(title)+'</h4><p>'+E(body)+'</p></div>'}
function gate(title,desc,label,target){return box(title,desc,'alert')+take('goto',label,'class="primary" data-id="'+target+'"')}
function field(label,id,inner){return '<label class="field">'+E(label)+inner+'</label>'}

function hdr(n, title, description) {
  return '<h2>' + E(title) + '</h2><p class="lead">' + E(description) + '</p>';
}

function tracePane() {
  const context = plan.context;
  const facts = [
    ['业务目标',context.goal],['客群',context.audience],['投放渠道',context.channel],
    ['活动场景',context.sceneLabel],['制作资源',context.lean ? '精简素材' : '标准制作']
  ];
  return '<section class="side"><h3>当前活动</h3>' +
    facts.map(([label, value]) => '<div class="fact"><span>'+E(label)+'</span><b>'+E(value)+'</b></div>').join('') +
    '<hr class="rule"><p>简报'+(briefOK ? '已确认' : '待确认')+' · 选品'+(selectionOK ? '已审核' : '待审核')+'</p></section>' +
    '<section class="side"><h3>活动记录</h3><div class="flow">'+
    history.slice(0,3).map(item => '<div>'+E(item)+'</div>').join('')+
    '</div><details class="model"><summary>查看项目资料</summary><div><p>茶歇大会以北美留学生和年轻职场人为主要客群，覆盖四个食品消费场景。项目组选品、配置会场与渠道内容，活动 GMV 达 1.28 万美元，高于目标 28%。</p><p>本工作台使用 48 款历史商品。沈淇负责的工作涵盖活动资源位、优惠券、选品和创意流程设计。</p></div></details></section>';
}

function show(n=tab,scroll=false){tab=n;$('tabs').innerHTML=K.map((s,i)=>'<button type="button" class="tab" data-act="goto" data-id="'+i+'" aria-selected="'+(i===tab)+'">'+s+'</button>').join('');
 $('panel').innerHTML=[briefPage,productPage,creativePage,measurePage][tab]();$('rail').innerHTML=tracePane();if(scroll)$('panel').scrollIntoView({block:'start',behavior:'instant'});}
function briefPage(){const c=plan.context,s=plan.strategy;return hdr(1,'活动简报','写下要触达的人群、渠道和业务目标，或从下方案例开始。')+
'<div class="choices"><span class="hint">案例</span>'+['新客首购','品类教育','商品加购'].map((l,i)=>take('preset',l,'class="tiny" data-id="'+i+'" aria-pressed="'+(data.brief===presets[i])+'"')).join('')+'</div><label class="field">客户需求<textarea id="brief" rows="3" maxlength="1400">'+E(data.brief)+'</textarea></label><details class="model"><summary>调整目标、渠道及客群</summary><div class="fields">'+
field('业务目标','goal','<select id="goal">'+opts(gOpts,data.goal,{},true)+'</select>')+field('承接渠道','channel','<select id="channel">'+opts(chOpts,data.channel,{},true)+'</select>')+field('历史消费场景','scene','<select id="scene">'+opts(Object.keys(sceneNames),data.scene,sceneNames,true)+'</select>')+field('指定客群','audience','<input id="audience" placeholder="留空则从需求识别" maxlength="56" value="'+E(data.audience||'')+'">')+'</div></details><div class="request-bar">'+take('start','生成备选提案','class="primary"')+take('approveBrief','查看商品配置')+'</div>'+
'<hr class="rule"><div class="heading"><h3>策略建议</h3></div>'+box(s.title,s.decision)+
'<div class="split2"><div class="item"><h4>衡量指标</h4><p class="sub">'+E(s.kpi)+'。'+E(s.secondary)+'</p></div><div class="item"><h4>消费场景</h4><p class="sub">'+E(s.audienceLogic)+'</p></div></div>'+
'<details class="model"><summary>查看识别依据与待确认事项</summary><dl>'+['goal','audience','channel','scene'].map((k,i)=>'<dt>'+['目标','客群','渠道','场景'][i]+'：'+E(k==='scene'?c.sceneLabel:c[k])+'</dt><dd>'+E(c.source[k])+'</dd>').join('')+'</dl><ul class="sub">'+plan.questions.map(v=>'<li>'+E(v)+'</li>').join('')+'</ul></details>'}
function replayEligible(){return data.brief===presets[0]&&plan.context.goal==='新客首购'&&plan.context.channel==='小红书'&&plan.context.scene==='Zen Afternoon Tea'&&plan.context.audience==='北美留学生'&&!data.lock.length&&!data.exclude.length&&!plan.context.lean&&!advice}
function skuCard(p,i){const locked=data.lock.includes(p.id),check=approvedIds.has(p.id);return '<div class="sku"><div><span class="tag">'+E(p.roleLabel)+'</span><span class="meta">'+E(roles[p.role]||'历史陈列记录')+' · SKU '+E(p.id)+'</span><h4>'+E(p.name)+'</h4><p class="desc"><b>推荐依据　</b>'+E(p.reason)+'</p><details><summary class="meta">商品依据</summary><p class="desc">'+E(p.evidenceText)+'。活动库存、价格和毛利需在上线前核对。</p></details><label class="checkline"><input type="checkbox" data-check="'+E(p.id)+'" '+(check?'checked':'')+'>纳入创意清单</label></div><div class="op">'+keybtn('lock',locked?'解除锁定':'锁定此款','tiny',p.id)+keybtn('out','本轮缺货','tiny warn',p.id)+'</div></div>'}
function productPage(){if(!briefOK)return hdr(2,'给三个商品位分配任务','先确认客群和营销目标，Agent 才能判断商品应该放在哪里。')+gate('等待确认客户简报','简报里的渠道、目标和场景会影响选品排序。','回到客户需求',0);
 return hdr(2,'选品与资源位','用同一份简报比较候选商品，锁定主推款或按缺货情况替换。')+
 recommendationPanel() + (advice ? box('已采纳的选品建议',advice.rationale) : '') +
 '<div class="heading"><h3>'+E(plan.context.sceneLabel)+' · 商品配置</h3><span class="tag">'+plan.poolCount+' 款同场景 / '+plan.availableCount+' 款候选</span></div>'+
 (change?box('商品已调整',change,'alert'):'')+plan.selected.map(skuCard).join('')+
 '<details class="model"><summary>比较其他可选商品（'+plan.alternatives.length+' 款）</summary><div>'+plan.alternatives.map(p=>'<p class="sub"><b>'+E(p.name)+'</b>　'+E(p.reason)+'</p>').join('')+'</div></details>'+
 (data.exclude.length?'<div class="actions">'+take('restore','恢复本轮缺货商品','class="tiny"')+'</div>':'')+
 '<div class="actions">'+take('approveSku',selectionOK?'进入已审核创意 →':'确认选品并生成创意','class="primary"')+'<span class="hint" id="checkcount">'+approvedIds.size+' / '+plan.selected.length+' 款已核对</span></div><p class="hint">此处批准商品创意方向。实际价格、可售库存、促销条款须由运营上线前核验。</p>'}
function creativePage(){if(!selectionOK)return hdr(3,'从商品位到渠道创意','创意只使用本轮确认的 SKU。')+gate('等待选品审核','未批准或已失效的商品清单不会进入交付稿。','回到选品决策',1);
const c=plan.creative;return hdr(3,'渠道创意简报','核对拍摄方向、商品素材与渠道文案，导出后即可交给设计或内容团队。')+
 '<div class="choices">'+keybtn('lean',plan.context.lean?'恢复标准制作':'收紧制作预算','tiny','')+
 keybtn('swapChannel','改投 '+(plan.context.channel==='Instagram'?'小红书':'Instagram'),'tiny','')+keybtn('badArt','反馈：包装与实物不符','tiny','')+'</div>'+ (data.feedback?box('本轮素材反馈',data.feedback+'：按真实商品参考图返修，重新检查后再交付。','alert'):'')+
 '<div class="split2"><div class="item"><span class="kicker">'+E(c.format)+'</span><h3>'+E(advice?.headline||c.headline)+'</h3>'+c.frames.map((s,i)=>'<div class="frame"><b>0'+(i+1)+'</b>　'+E(s)+'</div>').join('')+'<p class="sub">行动提示：'+E(c.cta)+'</p></div><div><img class="photo" alt="本场景历史创意方向样张" src="'+VISUALS[plan.context.scene]+'"><p class="visual-note">茶歇大会历史创意样张</p>'+ (advice?box('模型建议的创意角度',advice.creativeAngle):'')+'</div></div><details class="model"><summary>展开 AIGC 提示词与核验清单</summary><div><pre>'+E(c.prompt)+'</pre><ul class="sub">'+[...c.qa,...(advice?.checks||[])].map(s=>'<li>'+E(s)+'</li>').join('')+'</ul></div></details>'+
 '<label class="checkline"><input type="checkbox" id="creativeApproval" '+(ownerQA?'checked':'')+'>已复核渠道、商品和文案。</label>'+
 '<div class="actions">'+take('deliver','导出营销交付稿 .txt','class="primary"')+keybtn('goto','看效果复盘 →','',3)+'</div>'}
const fields=[['visits','活动访客人数'],['productClicks','商品详情访客'],['cartUsers','加购人数'],['buyers','支付人数'],['firstBuyers','首购人数'],['firstGmv','首购实付额（美元）'],['categoryVisitors','品类入口曝光人数'],['categoryClicks','品类入口点击人数']];
function measurePage(){const m=plan.measurement;return hdr(4,'用户在哪一步流失？','输入同一活动、同一时间窗的去重人数。Agent 会校验分母，提出下一步该检查的环节。')+
 box('本轮业务目标：'+plan.strategy.kpi,plan.strategy.secondary)+
 '<div class="choices">'+take('sample','载入漏斗样例','class="tiny"')+take('zero','清空数据','class="tiny"')+'</div><div class="signals">'+fields.map(([k,v])=>field(v,k,'<input data-signal="'+k+'" type="number" min="0" step="'+(k==='firstGmv'?'0.01':'1')+'" value="'+E(data.signals[k]??'')+'" placeholder="未提供">')).join('')+'</div><div class="actions">'+take('measure','分析漏斗','class="primary"')+'</div>'+
 (m.metrics.length?'<div class="metricset">'+m.metrics.map(i=>'<div class="metric"><b>'+E(i.name)+'</b><strong>'+E(i.value)+'</strong><small>'+E(i.formula)+'</small></div>').join('')+'</div>':'')+
 box('数据怎么解释',m.diagnosis,m.validation?.length?'alert':'')+box('下一轮先验证什么',m.next)+
 '<p class="hint">样例使用假设人数。评估创意增量时，可做同渠道素材对照。</p>'}

let requestState = { id:'', status:'idle', error:'', source:'' };
let pendingController;

function recommendationPanel() {
  const current = requestState.id === stamp ? requestState : { status:'idle' };
  const busy = current.status === 'pending';
  const savedCase = replayEligible() ? take('replay','查看历史案例','class="tiny"') : '';
  if (stagedAdvice) return adviceCard();
  return '<div class="response"><h3>本轮选品提案</h3>' +
    '<p>结合'+E(plan.context.audience)+'的消费场景，比较主推、搭配及备选商品。</p>' +
    (current.error ? '<p class="notice" role="alert">'+E(current.error)+'</p>' : '') +
    '<div class="actions">'+take('generateAdvice',busy ? '正在生成提案…' : current.error ? '重新生成提案' : '生成备选提案',
       busy ? 'class="primary tiny pending" disabled' : 'class="primary tiny"') +
    (busy ? '' : savedCase)+'</div></div>';
}

function adviceCard() {
  const proposal = stagedAdvice;
  const caseLabel = requestState.source === 'case' ? '历史案例 · 新客首购' : '本轮备选提案';
  const names = proposal.skuIds.map(id => CATALOG.find(p => p.id === id).name);
  return '<div class="response"><div class="response-label">'+E(caseLabel)+'</div><h3>'+
    E(proposal.headline)+'</h3><p>'+E(proposal.rationale)+'</p><ul>'+
    names.map(name => '<li>'+E(name)+'</li>').join('')+'</ul><p>'+E(proposal.creativeAngle)+
    '</p><div class="actions">'+take('acceptModel','采纳提案','class="primary tiny"')+
    take('discard','保留当前配置','class="tiny"')+'</div></div>';
}

async function generateAdvice() {
  const context = job();
  if (requestState.id === context.contextId && requestState.status === 'pending') return;
  if (context.candidates.length < 3) { toast('请恢复商品或选择其他场景，至少需要三款候选。'); return; }
  pendingController?.abort();
  const controller = new AbortController();
  pendingController = controller;
  requestState = {id:context.contextId, status:'pending', error:'', source:'current'};
  stagedAdvice = null;
  show(1, false);
  try {
    const result = await window.YamiProposals.generate(context);
    if (context.contextId !== stamp || pendingController !== controller || controller.signal.aborted) return;
    stagedAdvice = checkAdvice(result.advice);
    requestState.status = 'ready';
    log('已生成本轮选品提案，等待确认。');
  } catch (error) {
    if (context.contextId !== stamp || pendingController !== controller || controller.signal.aborted) return;
    requestState.status = 'error';
    requestState.error = '本轮提案暂时未生成。可以重试，也可以使用下方候选继续选品。';
  } finally {
    if (context.contextId === stamp && pendingController === controller) {
      pendingController = null;
      if (tab === 1) show(1, false);
    }
  }
}

function download(blob,name){const x=URL.createObjectURL(blob),a=document.createElement('a');a.href=x;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(x),1200)}
function job(){return {type:'yami.context.v1',contextId:stamp,version,updatedAt:new Date().toISOString(),snapshotDate:'2025-04-15',brief:data.brief,goal:plan.context.goal,audience:plan.context.audience,channel:plan.context.channel,scene:plan.context.scene,sceneLabel:plan.context.sceneLabel,lean:plan.context.lean,exclude:data.exclude,lock:data.lock,selected:plan.selected.map(p=>p.id),candidates:CATALOG.filter(p=>p.scene===plan.context.scene&&!data.exclude.includes(p.id)).map(({id,name,scene,role})=>({id,name,scene,role})),restrictions:['历史陈列仅作方案依据；不虚构价格、销量、折扣、毛利、实时库存或健康功效。','最终商品、品牌文案和公开发布均须由运营确认。']}}
function activeNote(){return {brief:$('brief').value.trim(),goal:$('goal').value,channel:$('channel').value,scene:$('scene').value,audience:$('audience').value.trim()}}
function capture(){const v=activeNote();if(!v.brief){toast('请先输入客户需求。');return false}if(Object.keys(v).some(k=>(data[k]||'')!==v[k])){Object.assign(data,v,{exclude:[],lock:[],feedback:'',lean:undefined,signals:{}});change='';changed('已解析新简报；相关商品与创意需要重新核对。',true)}return true}
function diff(a,b){const after=new Set(b.map(p=>p.id));const before=new Set(a.map(p=>p.id));return {removed:a.filter(p=>!after.has(p.id)).map(p=>p.name),added:b.filter(p=>!before.has(p.id)).map(p=>p.name)}}
function useful(x){return typeof x==='string'&&x.trim().length>=2&&x.length<=1600}
function checkAdvice(a){if(!a||a.type!=='yami.advice.v1'||a.contextId!==stamp)throw Error('需要按最新简报重新生成。');if(![a.headline,a.rationale,a.creativeAngle].every(useful)||!Array.isArray(a.checks)||!a.checks.length||a.checks.length>16||!a.checks.every(useful))throw Error('建议缺少标题、取舍依据、创意或核验项。');if(!Array.isArray(a.skuIds)||a.skuIds.length!==3||new Set(a.skuIds).size!==3||a.skuIds.some(x=>!job().candidates.some(p=>p.id===x))||data.lock.some(x=>!a.skuIds.includes(x)))throw Error('建议必须含当前场景 3 款不同商品，保留锁定款且排除不可用款。');if(/(?:限时|全场|立减|满[0-9]+减|买一送一|全网最低|现货充足|近期销量第一|[1-9](?:\.\d)?折|\d+%\s*off|治疗|保证减重)/i.test([a.headline,a.rationale,a.creativeAngle].join('')))throw Error('建议中出现未经证实的促销、库存或功效描述。');return a}
let serial=0;
document.addEventListener('change',async e=>{let el=e.target;if(el.dataset.check){if(el.checked)approvedIds.add(el.dataset.check);else approvedIds.delete(el.dataset.check);selectionOK=false;ownerQA=false;$('checkcount').textContent=approvedIds.size+' / '+plan.selected.length+' 款已核对';$('rail').innerHTML=tracePane();return}if(el.id==='creativeApproval'){ownerQA=el.checked;return}});
document.addEventListener('click',e=>{const el=e.target.closest('button[data-act]');if(!el)return;const a=el.dataset.act,id=el.dataset.id;
 if(a==='goto'){if(tab===0&&Number(id)!==0&&$('brief')&&JSON.stringify(activeNote())!==JSON.stringify({brief:data.brief,goal:data.goal||'',channel:data.channel||'',scene:data.scene||'',audience:data.audience||''})){if(!capture())return}show(Number(id),false);return}
 if(a==='preset'){data={brief:presets[+id],exclude:[],lock:[],verified:[],signals:{}};change='';changed('已读取案例需求并形成简报建议。',true);show(0);return}
 if(a==='read'||a==='approveBrief'){if(!capture())return;if(a==='approveBrief'){briefOK=true;log('运营已确认客户简报，按目标匹配商品位。');show(1,true)}else{recalc();show(0);toast('已解析。确认建议后可继续选品。')}return}
 if(a==='out'||a==='restore'||a==='lock'){const before=[...plan.selected],q=CATALOG.find(p=>p.id===id);if(a==='out'){if(data.lock.includes(id)){toast('这款商品已锁定，先解除锁定再标记缺货。');return}data.exclude=[...new Set([...data.exclude,id])];}
 if(a==='restore')data.exclude=[];if(a==='lock')data.lock=data.lock.includes(id)?data.lock.filter(k=>k!==id):[...data.lock,id];
 changed(a==='out'?'收到缺货信息：重算商品位；旧创意退回。':a==='lock'?'已更新人工锁定约束。':'恢复本案商品，重新计算候选。');const d=diff(before,plan.selected);
 change=a==='out'?'已移出「'+q.name+'」。'+(d.added.length?'替补「'+d.added.join('、')+'」。':'本场景没有足够的备选。')+'保留同场景和已锁定商品，重新核对替补包装与库存。':a==='lock'?'已'+(data.lock.includes(id)?'锁定':'解除锁定')+'「'+q.name+'」。后续重排以当前锁定为约束。':'已恢复候选池，重新排序。';show(1);return}
 if(a==='approveSku'){if(plan.selected.length!==3||plan.selected.some(p=>!approvedIds.has(p.id))){toast('请先逐项确认 3 款候选商品；数量不足时先恢复商品或调整场景。');return}selectionOK=true;log('运营批准 3 个商品位；允许生成渠道创意。');show(2,true);return}
 if(a==='swapChannel'){data.channel=plan.context.channel==='Instagram'?'小红书':'Instagram';changed('改投 '+data.channel+'：原简报、选品和创意已退回审核。',true);change='';show(0,true);toast('新渠道的格式与承接入口已更新，请重新确认。');return}
 if(a==='lean'||a==='badArt'){pendingController?.abort();pendingController=null;version++;stamp=fresh();stagedAdvice=null;advice=null;ownerQA=false;if(a==='lean')data.lean=!plan.context.lean;else data.feedback='包装与商品实物参考图不符';recalc();log(a==='lean'?'调整制作资源，保留已确认商品，更新创意。':'收到包装反馈，创意需返修并重审。');show(2);return}
 if(a==='sample'||a==='zero'||a==='measure'){if(a==='sample')data.signals={visits:200,productClicks:40,cartUsers:0,buyers:0,firstBuyers:0};if(a==='zero')data.signals={};if(a==='measure'){data.signals={};for(const el of document.querySelectorAll('[data-signal]'))if(el.value!=='')data.signals[el.dataset.signal]=Number(el.value)}recalc();show(3);return}
 if(a==='deliver'){if(!ownerQA||!selectionOK){toast('请先核对本轮创意草案。');return}const content=plan.exportText+(advice?'\n本轮提案　'+advice.headline+'\n'+advice.creativeAngle+'\n'+advice.rationale+'\n'+advice.checks.join('\n'):'')+'\n版本：V'+version+'；团队审阅稿。';download(new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'}),'Yami_营销交付稿_V'+version+'.txt');toast('已导出本轮营销交付稿。');return}
 if (a === 'generateAdvice') { generateAdvice(); return; }
 if (a === 'start') {
   if (!capture()) return;
   briefOK = true;
   log('已确认简报，开始匹配活动商品。');
   generateAdvice();
   return;
 }
 if (a === 'replay' && replayEligible()) {
   pendingController?.abort();
   pendingController = null;
   requestState = {id:stamp, status:'ready', error:'', source:'case'};
   stagedAdvice = checkAdvice({...{
  "type":"yami.advice.v1",
  "contextId":"bluefocus-yami-first-purchase-example",
  "headline":"下课后的十分钟，一杯茶配哪款点心？",
  "skuIds":["1016154281","1016004821","1016013801"],
  "rationale":"这次求的是第一次下单。主推从 360g 蛋黄酥礼盒换成 80g 提子酥：两者都有历史主推位，但后者更容易讲清“一人下午茶”的使用场景。小规格不等于低价，因此不会承诺更便宜。抹茶麻糬和凤梨酥放进比较页，让用户按口味选择，不默认三件成套购买。",
  "creativeAngle":"小红书封面用课本、一杯茶和一份点心交代消费时刻。第二张对照三种口味，第三张把封面主推指向活动页同款商品卡；用首购 GMV 和首购人数看结果，收藏只作内容信号。",
  "checks":["上线前逐项核对目标仓库存、活动价格和包装图片授权。","确认三张图与活动页商品编号一致，并测试活动入口的来源标记。"]
}
, contextId:stamp});
   show(1);
   return;
 }
 if(a==='discard'){stagedAdvice=null;requestState={id:stamp,status:'idle',error:'',source:''};show(1);return}
 if(a==='acceptModel'&&stagedAdvice){const picked=stagedAdvice;const prev=version;changed('已采纳本轮提案。商品和创意进入审核。');pinned=[...picked.skuIds];advice=picked;recalc();change='来自 V'+prev+' 提案，已更新三款商品。请核对商品角色和创意。';show(1);return}
});
stamp=fresh();recalc();log('已载入新客首购案例。');show(0);

/* Local campaign decision workflow. All ranking inputs are observable, not predicted sales. */
(function (scope) {
  'use strict';

  const scenes = {
    'Zen Afternoon Tea': {
      label: '禅意下午茶', detect: /禅意|茶配点心|中式茶点|安静|茶歇独处|图书馆/,
      moment: '把阅读或工作间隙的一杯茶与一份点心摆在同一张桌上',
      setting: '暖木桌、瓷杯和自然侧光', avoid: '夜场灯光和派对道具',
      hero: /蛋黄酥|茶点|凤梨酥|绿豆冰糕|茶/, hook: '忙到下午，给自己留一杯茶的时间'
    },
    'Dopamine Recipes': {
      label: '多巴胺食谱', detect: /多巴胺|自制|DIY|食谱|调饮|手作|调制/i,
      moment: '用清晰的原料与步骤展示一份可以自己搭配的下午茶',
      setting: '明亮对比色、俯拍操作台、透明杯', avoid: '仅摆放礼盒而没有制作过程',
      hero: /抹茶粉|咖啡粉|干桂花|牛奶|果冻/, hook: '把今天的茶歇，调成自己喜欢的颜色'
    },
    'Indulgent Snacks': {
      label: '放肆吃一回', detect: /放肆|聚会|聚餐|派对|观影|电影夜|追剧|室友分享|多人分享/,
      moment: '从开袋到多人分食，拍出一桌观影或聚会零食',
      setting: '暖橙色、打开的零食包装、多人分享动作', avoid: '单人养生早餐的摆盘',
      hero: /魔芋爽|脆棒|小蛋糕|烤馍片|饼干/, hook: '今晚的电影，你带哪袋零食'
    },
    'Whole-Grain Wellness': {
      label: '五谷养生汇', detect: /五谷|全谷|全麦|粗粮|谷物|工位早餐|轻负担/,
      moment: '按口味、包装和食用时刻组织一份工位茶歇',
      setting: '浅米色桌面、谷物质感、朴素自然光', avoid: '营养疗效承诺和医疗图标',
      hero: /全麦|谷|粗粮|藜麦|奇亚籽/, hook: '给下午的工位，留一份谷物茶歇'
    }
  };

  const goals = {
    '新客首购': {
      detect: /新客首购|新客首单|新客|首购|首单|拉新|首次下单/, title: '让第一次来的人看懂一款商品，并找到下单入口',
      kpi: '新客首单实付 GMV', secondary: '首次购买人数、首单客单价；核对同一归因窗口。',
      action: '首屏突出一件认得出的食品，用一个直达商品卡的入口承接首购。',
      fit: /蛋黄酥|饼干|蛋糕|牛奶|茶|咖啡|面包|巧克力/, clue: '包装名称给出清晰的食品品类'
    },
    '商品加购': {
      detect: /商品加购|加购|连带|搭配买|凑单|购物篮|篮子|客单价/, title: '让主推商品和搭配商品的购买理由同时可见',
      kpi: '活动商品详情加购率', secondary: '加购人数 ÷ 活动商品详情访客数；辅看支付订单与件单数。',
      action: '主商品说明购买理由，搭配卡解释一起吃或分享的场景，以同一活动页承接。',
      fit: /礼盒|组合|连包|[0-9]+\s*(?:枚|包|条|口味|块|罐|颗)/, clue: '名称有组合或包装数量线索，适合说明分享方式'
    },
    '品类认知': {
      detect: /品类认知|认知|品牌曝光|认识|品类教育|种草|口味对比|新品推广/, title: '让用户辨认不同口味与使用方式，再进入品类浏览',
      kpi: '品类入口点击率', secondary: '点击品类入口人数 ÷ 看到入口人数；辅看商品浏览深度。',
      action: '按食用或制作过程铺开口味差异，用专属品类入口观察内容带来的主动浏览。',
      fit: /抹茶|凤梨|茉莉|红豆|藜麦|可可|桂花|海盐|蒜香|芝麻|魔芋/, clue: '名称包含易展现的口味或食材线索'
    }
  };
  const channels = {
    '小红书': {detect:/小红书|rednote|\bXHS\b/i, format:'3:4 竖版笔记', path:'笔记内按平台允许的方式提示活动名称，核对可用承接入口', cta:'收藏这份茶歇清单，在亚米活动页查看商品。', track:'用独立入口或活动码区分来源。平台不支持跳转时，不把收藏数计为订单。'},
    'Instagram': {detect:/instagram|\bIG\b|\breels?\b/i, format:'4:5 Instagram 轮播', path:'从品牌主页的活动链接到对应商品模块', cta:'Save your tea-break pick. Find the collection through our profile link.', track:'给主页活动链接添加渠道参数，分开统计轮播互动、到站访客与订单。'},
    '站内活动页': {detect:/站内|活动会场|App首页|站内首屏/i, format:'移动端首屏主视觉与三张商品卡', path:'首屏主题图 → 商品卡 → 详情页或加购入口', cta:'查看这三款茶歇搭配，挑选你的口味。', track:'分别标记首屏、主推卡、搭配卡和加购事件；按活动访客去重。'}
  };
  const defaultScene='Zen Afternoon Tea';
  const fieldLabels={goal:'业务目标',channel:'渠道',audience:'人群',scene:'消费场景'};
  const historyRole={hero:'历史主视觉旁陈列',carousel:'历史轮播位',support:'历史搭配陈列'};
  const numeric = value => typeof value==='number' && Number.isFinite(value) && value>=0;
  const uniq = list => [...new Set(list)];
  const norm = v => String(v ?? '').trim();
  const words = {
    tea: /茶粉|茉莉花茶|茶包|柚子茶|茶饮|冲泡/, coffee: /咖啡|拿铁粉/,
    dairy: /牛奶|奶饮/, pastry: /蛋黄酥|凤梨酥|糕点|蛋糕|沙琪玛|桃酥|绿豆冰糕|芝麻糕|年轮/,
    mochi: /大福|麻糬|麻薯/, crunchy: /饼干|脆棒|烤馍片|贝果片|面包干|小馒头/,
    bread: /面包|吐司/, savory: /魔芋爽|素毛肚|香辣/, sweet: /巧克力|果冻|糖果/, herb:/桂花/
  };
  function family(name) {
    return Object.keys(words).find(key=>words[key].test(name)) || 'other';
  }
  function detect(dict,text,override,fallback) {
    if (Object.hasOwn(dict,override)) return {value:override,source:'运营指定'};
    const candidates=[];
    for(const key of Object.keys(dict)){
      const pattern=new RegExp(dict[key].detect.source,dict[key].detect.flags.replace('g','')+'g');
      for(const match of text.matchAll(pattern)){
        const left=text.slice(Math.max(0,match.index-18),match.index).split(/[。，,；;]/).pop();
        if(/(?:不要|暂缓|停用|不(?:做|选|投放?|考虑|以)|放弃)\s*(?:再|用|投放|通过|采用|任何|单纯|只)?\s*$/.test(left))continue;
        let rank=/(?:改为|改成|切换到?|换成|改投|主投|改用|重点做|优先提升|主目标是|优先|主攻|聚焦|以)\s*$/.test(left)? 4 : 1;
        if(/(?:承接|回到|带回|引流到|进入)\s*$/.test(left))rank=0;
        candidates.push({key,rank,index:match.index});
      }
    }
    candidates.sort((a,b)=>b.rank-a.rank || a.index-b.index);
    return candidates.length ? {value:candidates[0].key,source:'需求原文'} : {value:fallback,source:'待确认的建议'};
  }
  function audienceFrom(text) {
    const groups=[[/留学生|学生党|海外学生|在美学生/,'北美留学生'],[/职场新人|上班族|办公室人群|年轻白领|年轻职场|通勤族/,'北美年轻职场人'],[/新移民|华人家庭|家庭客群/,'北美华人家庭'],[/亚洲食品爱好者|亚洲食品消费者/,'亚洲食品消费者']];
    return groups.filter(([p])=>p.test(text)).map(([,label])=>label).join('与');
  }
  function contextFor(input) {
    const text=norm(input.brief);
    const statedScene=Object.keys(scenes).find(k=>k===input.scene || scenes[k].label===input.scene || (k==='Whole-Grain Wellness' && input.scene==='全谷物茶歇'));
    const scene=detect(scenes,text,statedScene,defaultScene);
    const goal=detect(goals,text,input.goal,'新客首购');
    const channel=detect(channels,text,input.channel,'小红书');
    const aud=norm(input.audience)||audienceFrom(text);
    const budgetConstraint=/预算(?:缩|减|砍|低|少|有限|紧)|(?:低|零|削减|压缩|有限|收紧)预算|预算.{0,4}(?:砍半|收紧|减少|降低)|只用.{0,4}(?:旧图|现有素材)|没有.{0,3}拍摄预算/.test(text);
    const lean=typeof input.lean==='boolean'?input.lean:budgetConstraint;
    const context={brief:text,goal:goal.value,audience:aud||'北美留学生与年轻职场人',channel:channel.value,scene:scene.value,sceneLabel:scenes[scene.value].label,lean,
      source:{goal:goal.source,channel:channel.source,scene:scene.source,audience:norm(input.audience)?'运营指定':aud?'需求原文':'待确认的建议'}};
    return context;
  }

  function feature(product,context,index) {
    const scene=scenes[context.scene],goal=goals[context.goal],name=product.name;
    const evidence=[scene.label+'历史商品池'];const p={id:String(product.id),name,scene:product.scene,role:product.role||'',order:Number.isFinite(product.order)?product.order:index};
    const role=historyRole[p.role];
    if (role) evidence.push(role);
    const sceneFit=scene.hero.test(name);
    const goalFit=goal.fit.test(name);
    const pack=/\d+\s*(?:枚|包|条|块|连包|口味|颗|罐)/.test(name);
    const weight = name.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:g\b|克)/i);
    const portable=weight && +weight[1]<=120;
    let audienceFit=false;
    if (/职场|通勤|工位/.test(context.audience)) audienceFit=Boolean(portable||/条入|独立包装/.test(name));
    else if (/家庭|多人|聚会|室友/.test(context.audience+' '+scene.label)) audienceFit=Boolean(pack);
    if (sceneFit) evidence.push('品名有本场景的代表食材或形态');
    if (goalFit) evidence.push(goal.clue);
    if (audienceFit) evidence.push(/职场|通勤|工位/.test(context.audience)?'包装规格支持便携茶歇的假设':'数量标识支持多人分享的假设');
    return {...p,family:family(name),evidence,roleHint:role||'历史表未标注陈列位',goalFit,sceneFit,audienceFit,pack};
  }
  function pickScore(p,slot,chosen,context) {
    const novel= !chosen.some(s=>s.family===p.family);
    const otherBrand=!chosen.some(s=>s.name.split(' ')[0]===p.name.split(' ')[0]);
    let total=0,reason=[];
    const add=(test,points,note)=>{if(test){total+=points;reason.push(note)}};
    if(slot===0){
      add(p.role==='hero',context.goal==='新客首购'?6:2,'历史主推位可作为首屏依据');
      add(p.sceneFit,context.goal==='品类认知'?5:3,'商品形态适合体现主题');
      add(p.goalFit,context.goal==='新客首购'?2:4,goals[context.goal].clue);
    } else {
      add(novel,slot===1?6:4,'与已选商品的食用形态不同');
      add(otherBrand,1,'与已选商品提供不同品牌选择');
      add(p.role==='support'||p.role==='carousel',2,'历史陈列支持搭配或对比展示');
      add(p.goalFit, context.goal==='商品加购'?4:2, goals[context.goal].clue);
      add(slot===2 && context.goal==='品类认知' && p.sceneFit,3,'能进一步展示本场景的食材');
    }
    add(p.audienceFit,3,'包装规格与客群的使用方式相符');
    add(p.checked,3,'本次已确认可售');
    return {total,reason};
  }
  function choseProducts(input,catalog,context) {
    const exclude=new Set((input.exclude||[]).map(String)),locks=uniq((input.lock||[]).map(String)),verified=new Set((input.verified||[]).map(String));
    const all=catalog.filter(p=>p.scene===context.scene).map((row,i)=>({...feature(row,context,i),checked:verified.has(String(row.id))}));
    const rejected=all.filter(p=>exclude.has(p.id)).map(p=>({id:p.id,name:p.name,reason:'运营本轮排除，停止分配资源位'}));
    const available=all.filter(p=>!exclude.has(p.id)),selected=[],labels=context.goal==='品类认知'?['品类主角','使用方式搭配','口味对照']:['首屏主推','场景搭配','补充选择'];
    const scoreSort=(a,b)=> b.score.total-a.score.total || a.p.order-b.p.order;
    for(let i=0;i<3;i++){
      const ranked=available.filter(p=>!selected.some(s=>p.id===s.id)).map(p=>({p,score:pickScore(p,i,selected,context)})).sort(scoreSort);
      const lockedId=locks.find(id=>ranked.some(x=>x.p.id===id));
      const chosen=(lockedId && ranked.find(x=>x.p.id===lockedId)) || ranked[0];
      if(!chosen)break;
      const {p,score}=chosen;
      const rankedBy=score.reason.length ? score.reason.slice(0,2).join('，'):'依据同场景历史名单和原始陈列顺序候选';
      const reason=(lockedId?'运营锁定此商品。':'')+rankedBy+'。';
      selected.push({...p,roleLabel:labels[i],reason,why:reason,locked:Boolean(lockedId),stockNote:p.checked?'运营已确认可售':'可售情况待核对',evidenceText:p.evidence.join('、')});
    }
    const hero=selected[0];
    const replacement=available.filter(p=>!selected.some(s=>s.id===p.id)).map(p=>{
      const score=pickScore(p,0,[],context);
      if(hero&&p.family===hero.family){score.total+=5;score.reason.unshift('可延续首屏主推的食品形态')}
      const why=score.reason.slice(0,2).join('，')||'同场景历史商品，可进入人工比选';
      const reason=why+'。换入后更新商品卡、包装参考图与相关文案，并核对可售状态。';
      return {p:{...p,roleLabel:'备选商品',reason,why:reason,stockNote:p.checked?'运营已确认可售':'可售情况待核对',evidenceText:p.evidence.join('、')},score};
    }).sort(scoreSort).map(r=>r.p);
    return {selected,alternatives:replacement,rejected,poolCount:all.length,availableCount:available.length};
  }

  function creativeFor(context,selected){
    const sc=scenes[context.scene],ch=channels[context.channel];
    const names=selected.map(p=>p.name), main=names[0]||'待确认主推商品',pair=names[1]||'待确认搭配品';
    const hook = context.goal==='商品加购'?'这份茶歇，还想搭点什么？':sc.hook+(context.scene==='Indulgent Snacks'?'？':'');
    const visual=context.lean?'优先复用已获使用许可的商品图与一张场景图，通过裁切和排版完成适配。':'先制作一张场景主视觉，再补主推包装与搭配细节。';
    const routes={
      '小红书':[`封面用“${hook}”提出具体生活情境，展示${main}。`,`内页按${context.goal==='商品加购'?'一起吃的顺序':'场景与口味差异'}对照${main}和${pair}。`,'末页列茶歇清单，提示前往活动页查看商品。'],
      'Instagram':[`Slide 1 用场景动作带出 ${main}，封面只放一个焦点。`,`Slides 2–3 用已核实的包装和口味对比 ${main} 与 ${pair}。`,'Slide 4 留一个英文行动提示，引导从主页链接查看活动。'],
      '站内活动页':[`首屏以${main}承担${selected[0]?.roleLabel||'主推'}，标出本次茶歇场景。`,`首屏下方用商品卡呈现${pair}与主推的搭配理由。`,'结算承接区检查选中项、商品链接和实际可用权益。']
    };
    const format=ch.format;
    const qa=['商品名、包装、容量与已批准的实物参考图一致。','价格、优惠及库存由运营核实后再写入对外物料。',`以${format}检查文字安全区并测试${ch.path}。`];
    return {headline:hook,format,cta:ch.cta,frames:routes[context.channel],qa,tracking:ch.track,
      prompt:`为北美${context.sceneLabel}活动准备${format}。受众为${context.audience}，目标为${context.goal}。场景动作：${sc.moment}。主角商品：${main}；搭配商品：${pair}。视觉采用${sc.setting}，避免${sc.avoid}。${visual}按获准商品图保留包装形状和标志，准确文案由设计师后期排入。为“${hook}”和 CTA 留白。商品图、品牌授权和文案确认后交付。`};
  }

  // Normalize measured aggregate counts only. Incomplete or mismatched funnels stay diagnostic questions.
  function measure(context,signals={}){
    const s={};Object.entries(signals||{}).forEach(([k,v])=>{if(numeric(v) || (typeof v==='string' && v.trim()!=='' && numeric(Number(v))))s[k]=Number(v)});
    const metrics=[],errors=[];
    const integerKeys=['visits','productClicks','cartUsers','buyers','firstBuyers','categoryVisitors','categoryClicks'];
    for(const key of integerKeys) if(s[key]!==undefined && !Number.isInteger(s[key])) errors.push('人数需为整数');
    for(const [a,b] of [['productClicks','visits'],['cartUsers','productClicks'],['buyers','visits'],['firstBuyers','buyers'],['firstGmv','gmv'],['categoryClicks','categoryVisitors']])
      if(s[a]!==undefined&&s[b]!==undefined&&s[a]>s[b]) errors.push('下游或子集数值大于对应分母，请核对同一时间窗及人群');
    const hasError=errors.length>0;
    const rate=(key,a,b,label,formula)=> {
      if(s[a]===undefined||s[b]===undefined||s[b]===0||hasError)return;
      metrics.push({key,name:label,value:(100*s[a]/s[b]).toFixed(1)+'%',formula});
    };
    rate('entry','productClicks','visits','商品详情到达率','进入商品详情的活动访客 ÷ 活动访客');
    rate('cart','cartUsers','productClicks','详情加购率','产生加购的访客 ÷ 进入商品详情的访客');
    rate('convert','buyers','visits','活动购买率','活动购买人数 ÷ 活动访客');
    rate('category','categoryClicks','categoryVisitors','品类入口点击率','点击入口人数 ÷ 看到入口的人数');
    if(!hasError && s.firstGmv!==undefined)metrics.push({key:'firstGmv',name:'新客实付 GMV',value:s.firstGmv.toLocaleString('en-US'),formula:'同一归因窗内首单实付金额合计，币种沿用输入'});
    const planned={
      '新客首购':['用渠道专属入口串起首次到站、商品浏览和首单实付。','对比单主推与多商品首屏，固定渠道、受众和归因期，用新客首单实付 GMV 和首次购买人数判断。'],
      '商品加购':['验证搭配卡被看见后，用户是否进入详情并加购。','同渠道等流量比较「主推单卡」与「主推＋场景搭配」，记录详情加购率，辅查支付。'],
      '品类认知':['追踪内容带来的品类入口点击，再观察商品详情浏览。','对照口味比较与场景故事两种素材，固定受众与入口，按品类入口点击率及后续商品浏览决策。']
    }[context.goal];
    let [diagnosis,next]=planned;
    if(hasError) {diagnosis=uniq(errors).join('。'); next='修正口径后重新计算，再决定是否调整素材或商品位。'}
    else if(s.visits===0){diagnosis='本次观察窗没有活动访客，无法估算转化率。';next='先确认入口正常、流量到达和归因事件，再继续测试。'}
    else if(s.productClicks===0&&s.visits>0){diagnosis='已有活动访客，但没有进入商品详情的记录。';next='实机验证链接与埋点，再测试首屏商品露出；暂不改变商品定价。'}
    else if(s.productClicks>0&&s.cartUsers===0){diagnosis='已记录详情访问，加购人数为零。';next='先检查按钮、库存和权益呈现，再比较单品卡和搭配卡。'}
    else if(s.cartUsers>0&&s.buyers===0){diagnosis='用户已加购，本观察窗内还没有支付。';next='按同一归因窗核查配送、库存与结算路径；再测试承接页。'}
    else if(metrics.length)diagnosis='已按输入计算同一观察窗口径。效果增量还需对照组，或可比的基线周期。';
    return {metrics,diagnosis,next,validation:uniq(errors)};
  }

  function plan(input={},catalog=[]){
    const context=contextFor(input), g=goals[context.goal], ch=channels[context.channel];
    const picks=choseProducts(input,catalog,context);
    const questions=Object.keys(fieldLabels).filter(k=>context.source[k]==='待确认的建议').map(k=>`${fieldLabels[k]}暂按“${k==='scene'?context.sceneLabel:context[k]}”规划，是否符合本轮需求？`);
    const feedback=norm(input.feedback), qualityIssue=/画面|包装|商品图|logo|色差|失真|错字|规格不符/i.test(feedback);
    if(picks.selected.some(p=>!p.checked))questions.push('哪些主推与搭配 SKU 已核对目标仓库存、活动价和可投放素材？');
    if(picks.selected.length<3)questions.push('当前场景可用候选不足三款，需要补充商品或调整商品位数量。');
    const ignoredLocks=(input.lock||[]).map(String).filter(id=>!picks.selected.some(p=>p.id===id));
    if(ignoredLocks.length)questions.push('部分锁定商品与当前场景、排除清单或位次冲突，请核对后再确认选品。');
    const strategy={title:g.title,kpi:g.kpi,secondary:g.secondary,
      decision:`${g.action} 渠道承接从${ch.path}。${context.lean?'本轮优先一套主视觉跨尺寸复用，把制作预算集中在首屏。':'先制作渠道主稿，再适配商品卡与承接页。'}`,
      audienceLogic:`${context.audience}的使用假设：${scenes[context.scene].moment}。可通过同渠道素材对照验证。`};
    const creative=creativeFor(context,picks.selected);
    if(qualityIssue){creative.qa.unshift(`针对反馈“${feedback}”，请重新对照商品参考图，问题修正前保留草稿。`);creative.prompt+=' 先修正已标注的素材问题，再提交下一轮审稿。'}
    const measurement=measure(context,input.signals);
    const trace=[
      {step:'读需求',detail:`将${context.goal}设为主目标，面向${context.audience}，从${context.channel}进入${context.sceneLabel}场景。`},
      {step:'查商品',detail:`检索 ${catalog.length} 条历史记录，${picks.poolCount} 条属于该场景，排除 ${picks.rejected.length} 条，得到 ${picks.selected.length} 个建议商品位。`},
      {step:'编排创意',detail:`按${ch.format}制作可审核的创意 Brief。 ${context.lean?'降低素材数量，优先复用素材。':'保留场景主视觉与商品细节两个视角。'}`},
      {step:'设计复盘',detail:`将${g.kpi}作为业务结果，${ch.track}`}
    ];
    const exportText=[
      'Yami 茶歇大会｜营销活动方案草稿',
      `业务需求　${context.brief||'据本次结构化选择整理'}`,
      `目标与渠道　${context.goal}｜${context.audience}｜${context.channel}｜${context.sceneLabel}`,
      strategy.title,strategy.decision,`衡量方式　${strategy.kpi}。 ${strategy.secondary}`,
      '商品与资源位',...picks.selected.map(p=>`${p.roleLabel}　${p.name}（${p.id}）\n依据　${p.evidenceText}。 ${p.reason} ${p.stockNote}`),
      '替补候选',...picks.alternatives.slice(0,2).map(p=>`${p.name}（${p.id}）　${p.reason}`),
      '创意交付',creative.headline,creative.format,...creative.frames,creative.cta,creative.prompt,
      '发布前核验',...creative.qa,'监测与下一轮',measurement.diagnosis,measurement.next,...measurement.metrics.map(m=>`${m.name}　${m.value}（${m.formula}）`),
      '待运营确认',...questions,'数据来源为茶歇大会历史商品快照。'
    ].join('\n');
    return {context,questions,strategy,...picks,creative,measurement,trace,exportText};
  }
  const engine={plan};
  scope.YamiEngine=engine;
  if(typeof module!=='undefined'&&module.exports)module.exports=engine;
})(typeof globalThis!=='undefined'?globalThis:this);

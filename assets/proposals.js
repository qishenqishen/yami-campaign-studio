/* Yami Campaign Copilot: a second merchandising proposal for the current brief. */
(function (scope) {
  'use strict';

  const goals = {
    '新客首购': {
      key: 'first_purchase', measure: '首次购买人数与首单实付金额',
      tradeoff: '首屏优先解释一件商品的食用时刻，其他口味放到第二屏比较。',
      call: '给首次到访的人一个直达首款商品详情的入口'
    },
    '商品加购': {
      key: 'add_to_cart', measure: '商品详情访客中的加购人数占比',
      tradeoff: '留出一个商品位解释两款如何搭配，并分别保留单买入口。',
      call: '让顾客从主推卡进入详情后，自行选择是否加购搭配款'
    },
    '品类认知': {
      key: 'category_discovery', measure: '品类入口点击率与商品浏览深度',
      tradeoff: '用两个不同口味或形态拉开对照，减少单个商品能占用的画面。',
      call: '把对口味有兴趣的人带到同一品类的浏览入口'
    }
  };

  const kitchens = {
    'Zen Afternoon Tea': { moment:'下午茶', scene:'在一杯热茶旁拆开点心', subject:'今天的茶配哪份点心？' },
    'Dopamine Recipes': { moment:'自制茶饮', scene:'先摆原料，再拍冲调和成品', subject:'把今天的下午茶调成自己的口味' },
    'Indulgent Snacks': { moment:'分享零食', scene:'打开零食，拍到几个人围桌分食', subject:'电影开场前，一桌人挑哪三样？' },
    'Whole-Grain Wellness': { moment:'工位茶歇', scene:'把食品包装和实际食用的一份放在工位上', subject:'下次工位茶歇，想换哪一种口感？' }
  };

  const channels = {
    '小红书':'以一张真实消费场景作封面，第二张比较口味，最后一张标清去哪找同款。',
    'Instagram':'用 4:5 轮播展示场景、食物细节与口味对照，结尾引导至主页活动入口。',
    '站内活动页':'移动端首屏只呈现主推与一个行动按钮；下一屏再展开两个备选商品卡。'
  };

  const categories = [
    ['ingredient','冲调原料',/抹茶粉|果冻粉|咖啡粉|干桂花|仙草粉|凉粉粉|速溶黑咖啡/],
    ['drink','饮品',/牛奶|花茶|柚子茶/],
    ['gel','麻糬或果冻',/大福|麻糬|冰粉|果冻/],
    ['cake','蛋糕或面包',/年轮|小蛋糕|吐司|面包|贝果/],
    ['pastry','酥点',/酥|糕|凤梨/],
    ['chocolate','巧克力',/巧克力/],
    ['salty','咸香零食',/魔芋爽|烤馍|香辣|蒜香/],
    ['biscuit','饼干',/饼干|脆棒|小馒头|饼/]
  ];
  const flavors = /抹茶|凤梨|香辣|茉莉|蒜香|桂花|芝麻|原味|红枣|可可|红豆|海盐|黄油|提子|巧克力|蛋黄/;
  const text = value => String(value ?? '').trim();
  const weight = {g:1,kg:1000,ml:1,l:1000};

  function properties(row) {
    const name=text(row.name), unit=name.match(/(\d+(?:\.\d+)?)\s*(kg|ml|g|l)\b(?:\s*[*×x]\s*(\d+))?/i);
    const pack=name.match(/(\d+)\s*(?:枚|入装|件|颗|包入|连包|包|条|罐|块)/);
    const cat=categories.find(([, ,test])=>test.test(name)) || ['food','食品'];
    const amount=unit ? Number(unit[1])*weight[unit[2].toLowerCase()]*(Number(unit[3])||1) : null;
    const family=unit && /l/i.test(unit[2]) ? 'drink' : 'solid';
    return {id:text(row.id), name, role:row.role, category:cat[0], categoryName:cat[1], amount, family,
      sizeText:unit?.[0]||'', pack:Number(pack?.[1]||0), flavor:name.match(flavors)?.[0]||'',
      gift:/礼盒/.test(name), historical:row.role==='hero' ? 2 : ['support','carousel'].includes(row.role) ? 1 : 0};
  }

  function scoreLead(item,ctx,goal,sharing) {
    const small=item.amount!==null && item.amount<=115, medium=item.amount!==null && item.amount<=250;
    let score=item.historical;
    if (goal.key==='first_purchase') {
      score+=(small?6:medium?3:0)+(item.flavor?1:0)+(item.gift?-3:0);
      if (!sharing && item.category==='ingredient') score-=2;
    } else if (goal.key==='add_to_cart') {
      score+=(item.pack>=4?4:0)+(sharing&&item.pack>=7?3:0)+(item.gift?1:0);
    } else {
      score+=(item.flavor?3:0)+(item.category==='ingredient'?3:0)+(item.gift?-1:0);
    }
    if(ctx.scene==='Dopamine Recipes' && ['ingredient','drink'].includes(item.category)) score+=2;
    if(ctx.scene==='Whole-Grain Wellness' && /全麦|谷|藜麦/.test(item.name)) score+=3;
    if(ctx.scene==='Indulgent Snacks' && sharing && !item.gift && item.pack>=2) score+=2;
    if(ctx.scene==='Zen Afternoon Tea' && item.category==='pastry' && !item.gift) score+=2;
    return score;
  }

  function rankItems(ctx) {
    const goal=goals[ctx.goal] || goals['新客首购'];
    const sharing=/分享|室友|家庭|多人|聚会/.test(text(ctx.audience)+' '+text(ctx.brief));
    const excluded=new Set((ctx.exclude||[]).map(text)), locks=[...new Set((ctx.lock||[]).map(text))];
    const pool=[], seen=new Set();
    for(const row of ctx.candidates||[]) {
      const id=text(row.id);
      if(!/^\d+$/.test(id)||!text(row.name)||excluded.has(id)||seen.has(id)||row.scene!==ctx.scene) continue;
      seen.add(id);
      const item=properties(row);
      item.score=scoreLead(item,ctx,goal,sharing);
      pool.push(item);
    }
    if(pool.length<3) throw new Error('本场景的候选不足三款，请补充商品或调整排除条件。');
    if(locks.length>3||locks.some(id=>!seen.has(id))) throw new Error('请先核对当前场景的锁定商品。');
    pool.sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
    const selected=[];
    function append(item){selected.push(item);}
    for(const id of locks) append(pool.find(p=>p.id===id));
    if(!selected.length) append(pool[0]);
    while(selected.length<3) {
      const scores=pool.filter(item=>!selected.includes(item)).map(item=>{
        const types=selected.map(p=>p.category), flavorSeen=!!item.flavor&&selected.some(p=>p.flavor===item.flavor);
        const complement=(types.includes('ingredient')&&item.category==='drink') || (types.includes('drink')&&item.category==='ingredient');
        const continuity=(ctx.selected||[]).includes(item.id)?1:0;
        const different=types.includes(item.category)?0:1;
        const score=item.score*.5 + different*(goal.key==='category_discovery'?7:4) + (item.flavor&&!flavorSeen?2:0) + (complement?6:0) + continuity*1.5;
        return {item,score};
      });
      scores.sort((a,b)=>b.score-a.score || a.item.id.localeCompare(b.item.id));
      append(scores[0].item);
    }
    return {pool,selected,locks,goal,sharing};
  }

  function compose(ctx,ranking,selected) {
    const {goal}=ranking;
    const scene=kitchens[ctx.scene]||{moment:'茶歇',scene:'把商品放入本次的使用场景',subject:'这次茶歇，怎么选？'};
    const [hero,two,three]=selected;
    const prior=ranking.pool.find(i=>i.id===ctx.selected?.[0]);
    const changed=prior && prior.id!==hero.id;
    const size=hero.sizeText ? '，包装标示 '+hero.sizeText : '';
    let reason;
    if(goal.key==='first_purchase') {
      reason=hero.amount!==null&&hero.amount<=115 ? '这款适合用一人尝鲜的场景开篇，挑选理由容易在首屏讲清。' : '先用能看清品类和包装的一款商品介绍茶歇吃法，再引导首次购买。';
    } else if(goal.key==='add_to_cart') {
      reason=hero.pack>=2 ? '包装标有 '+hero.pack+' 个包装单位，可拍成多人分享或分次食用的组合。' : '先说明主推的食用场景，再给出一个用户能单独加购的搭配。';
    } else {
      reason='它提供了可直接展示的'+(hero.flavor?hero.flavor+'口味':'商品形态')+'，适合作为认识这一品类的入口。';
    }
    const compare=changed ? '首屏从「'+prior.name+'」调整为「'+hero.name+'」'+size+'。' : '继续让「'+hero.name+'」承担首屏'+size+'。';
    const retained=selected.filter(p=>ctx.selected?.includes(p.id)&&p.id!==hero.id).map(p=>p.name);
    const support=retained.length ? '保留「'+retained[0]+'」作比较，并把另外的商品放到后续商品卡。' : '另两款放在对照卡里，按食用方式和口味区分。';
    const checks=['上线前由商品负责人核对三款商品的包装、目标仓库存和活动价格。','核对素材里的商品编号与落地页一致，检查来源标记，按同一归因时间窗查看'+goal.measure+'。'];
    return {
      type:'yami.advice.v1',contextId:ctx.contextId,headline:scene.subject,skuIds:selected.map(p=>p.id),
      rationale:compare+reason+support+goal.tradeoff,
      creativeAngle:(channels[ctx.channel]||channels['站内活动页'])+'首镜'+scene.scene+'，突出「'+hero.name+'」。用「'+two.name+'」与「'+three.name+'」形成对照，'+goal.call+'。',
      checks
    };
  }

  let generation=0, pending=null;
  function abortError(){return new DOMException('活动版本已更新','AbortError');}
  async function nativeSelection(ranking) {
    const model=scope.LanguageModel;
    if(!model||typeof model.availability!=='function'||typeof model.create!=='function'||ranking.locks.length===3)return null;
    const options={expectedInputs:[{type:'text',languages:['en']}],expectedOutputs:[{type:'text',languages:['en']}]};
    const controller=new AbortController();pending=controller;
    let session=null;
    let timer;
    const abortPromise=new Promise(resolve=>{
      controller.signal.addEventListener('abort',()=>resolve(null),{once:true});
      timer=setTimeout(()=>controller.abort(),1850);
    });
    const release=s=>{try{s?.destroy()}catch{}};
    const run=async()=>{
      if(await model.availability(options)!=='available'||controller.signal.aborted)return null;
      const local=await model.create({...options,signal:controller.signal});
      if(controller.signal.aborted){release(local);return null}
      session=local;
      const shortlist=[...new Set([...ranking.selected,...ranking.pool.slice(0,6)])].slice(0,6);
      const items=shortlist.map(x=>({id:x.id,category:x.category,unit:x.amount===null?'unknown':x.family==='drink'?'ml':'g',qty:x.amount,pieces:x.pack,role:x.role,locked:ranking.locks.includes(x.id)}));
      const prompt='Rank exactly three different SKU IDs for a North American tea break campaign. Goal: '+ranking.goal.key+'. Compare the merchandising roles, sizes and complementary categories. Keep every locked ID. First ID is the hero. Return only a JSON list of three quoted ID strings. Options: '+JSON.stringify(items);
      const result=await local.prompt(prompt,{signal:controller.signal});if(controller.signal.aborted)return null;
      const ids=JSON.parse(String(result).trim().replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,''));
      if(!Array.isArray(ids)||ids.length!==3||!ids.every(id=>typeof id==='string'&&shortlist.some(p=>p.id===id))||new Set(ids).size!==3||ranking.locks.some(id=>!ids.includes(id)))return null;
      return ids.map(id=>shortlist.find(p=>p.id===id));
    };
    try{return await Promise.race([run().catch(()=>null),abortPromise]);}
    finally{clearTimeout(timer);controller.abort();release(session);if(pending===controller)pending=null}
  }

  async function generate(context) {
    const turn=++generation;
    if(pending)pending.abort();
    if(!context?.contextId)throw new Error('请先确认当前营销简报。');
    const ranking=rankItems(context);
    const selected=await nativeSelection(ranking);
    if(turn!==generation)throw abortError();
    return {advice:compose(context,ranking,selected||ranking.selected)};
  }
  scope.YamiProposals={generate};
})(typeof window==='undefined'?globalThis:window);

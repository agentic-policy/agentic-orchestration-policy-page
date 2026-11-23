(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const C={direct:'#bc8855',fixed:'#927c9c',aop:'#176d66'};
  const labels={direct:'Direct',fixed:'Fixed',aop:'ACAP'};
  function bars(rows,max=30){
    return rows.map(([label,values])=>`<div class="metric-row"><h4>${label}</h4><div>${Object.entries(values).map(([mode,value])=>`<div class="metric-bar ${mode}"><span>${labels[mode]}</span><div><i style="width:${value/max*100}%;background:${C[mode]}"></i></div><b>${value.toFixed(2)}</b></div>`).join('')}</div></div>`).join('');
  }
  $('#timing-bars').innerHTML=bars([['Concurrent reasoning',{fixed:14.78,aop:6.86}],['Coordination waiting',{fixed:13.86,aop:2.85}],['Elapsed time',{fixed:28.83,aop:14.46}]]);
  const coverage=[['Fully Parallel',{direct:20.49,aop:13.22}],['Parallel–Sequential',{direct:20.27,aop:13.86}],['Collaborative',{direct:16.25,aop:13.75}]];
  function trials(task){
    const y=v=>183-v/30*154,centers=[95,195,295];
    return `<article class="trial-plot"><h4>${task.title}</h4><svg viewBox="0 0 360 235" role="img" aria-label="${task.title}. Five trials per policy. Lower time cost is better.">${[0,10,20,30].map(v=>`<path d="M38 ${y(v)}H345" stroke="#d5ddd5" ${v===30?'stroke-dasharray="3 3"':''}/><text x="28" y="${y(v)+4}" text-anchor="end" class="trial-axis">${v}</text>`).join('')}${['direct','fixed','aop'].map((mode,j)=>{const m=task.modes[mode],x=centers[j],color=C[mode];return m.trials.map((t,k)=>{const cx=x+(k-2)*10,cy=y(t.cost),title=`${labels[mode]} trial ${k+1}: ${t.completed?t.cost.toFixed(2)+' min':'not completed by 30 min'}`;return t.completed?`<circle cx="${cx}" cy="${cy}" r="4" fill="${color}"><title>${title}</title></circle>`:`<path d="M${cx-4} ${cy-4}l8 8m-8 0l8 -8" fill="none" stroke="${color}" stroke-width="1.8"><title>${title}</title></path>`;}).join('')+`<path d="M${x-31} ${y(m.mean)}h62" stroke="${color}" stroke-width="2.5"><title>${labels[mode]} mean: ${m.mean.toFixed(2)} min</title></path><text x="${x}" y="206" text-anchor="middle" class="trial-policy" style="fill:${color}">${labels[mode]}</text><text x="${x}" y="226" text-anchor="middle" class="trial-mean-label" style="fill:${color}">${m.mean.toFixed(2)} min</text>`;}).join('')}</svg></article>`;
  }
  function trialCategories(){return ['Fully Parallel','Parallel-Sequential','Collaborative'].map(category=>`<section class="trial-category"><h3>${category.replace('-','–')}</h3>${window.AOP_DATA.tasks.filter(t=>t.category.replace('–','-')===category).map(trials).join('')}</section>`).join('');}
  function study(key){
    const repeated=key==='repeated';
    document.querySelectorAll('[data-study]').forEach(b=>{const selected=b.dataset.study===key;b.classList.toggle('active',selected);b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;});
    $('#study-title').textContent=repeated?'Six tasks, repeated five times per policy.':'Three dependency categories.';
    $('#study-scope').textContent=repeated?'90 real-world rollouts':'25 task–platform settings · 72 real-world rollouts';
    $('#study-reduction').innerHTML=(repeated?'29.4':'28.2')+'<small>%</small>';
    $('#study-policy-key').hidden=repeated;
    $('#trial-symbols').hidden=!repeated;
    $('#chart-units').hidden=repeated;
    $('#study-chart').className=repeated?'trial-grid':'coverage-bars';
    $('#study-chart').innerHTML=repeated?trialCategories():bars(coverage);
    $('#study-takeaway').textContent=repeated?'ACAP has lower mean time cost on all six tasks.':'ACAP has lower mean time cost in all three task categories.';
    $('#study-auc').innerHTML=repeated?'<span>Direct 58.1%</span><span aria-hidden="true">→</span><span>ACAP 68.3%</span>':'<span>Direct 62.3%</span><span aria-hidden="true">→</span><span>ACAP 72.9%</span>';
  }
  document.querySelectorAll('[data-study]').forEach(b=>b.addEventListener('click',()=>study(b.dataset.study)));
  study('coverage');
  $('.progress-result').title='The time average of human-scored best-attained task progress over 30 minutes.';
  const overlap=document.createElement('div');overlap.className='overlap-insight';
  overlap.innerHTML='<div><h3>The largest overlap is in reasoning.</h3><p>ACAP performs more total reasoning work while finishing sooner. Agents overlap their reasoning with one another and with robot execution.</p></div><figure><figcaption>Additional overlap vs Direct · repeated trials</figcaption>'+[['Reasoning ↔ Reasoning',9.51],['Reasoning ↔ Execution',1.44],['Execution ↔ Execution',.14]].map(([label,value])=>`<div class="overlap-row"><span>${label}</span><div><i style="width:${value/10*100}%"></i></div><b>${value.toFixed(2)} min</b></div>`).join('')+'</figure>';
  $('#experiments').append(overlap);
  const examples={
    flower:{title:'Locate the tip from a known motion',code:'s = np.linalg.lstsq(\n    np.stack([-rays[0], rays[1]],\n             axis=1),\n    d, rcond=None\n)[0]\np1 = T[:3,3] + s[1]*rays[1]',copy:[
      'Two views from a fixed camera track the tip as the hand rises by 129 mm.',
      'The measured hand translation constrains the two image rays. Least squares gives an initial 3D tip estimate.',
      'The agent checks alignment above the vase, descends in steps, then releases the stem.'
    ],output:['Measured hand translation: 129 mm','Estimated tip: [0.364, 0.075, 0.301] m','Align → refine → lower → release']},
    basket:{title:'Estimate the hidden underside',code:'u, s, vh = np.linalg.svd(\n    (A-ac).T @ (B-bc))\nR = vh.T @ np.diag([\n    1, 1, np.linalg.det(vh.T@u.T)\n]) @ u.T\nt = bc - R@ac\nC = R@np.array([x,y,z]) + t',copy:[
      'Depth points define the basket rim and support plane. Tracked features reveal the basket’s motion.',
      'A fitted rigid transform propagates the underside estimate, including its tilt and clearance above the sponge.',
      'The lead adjusts both wrists and lowers the basket. New observations check support after both grippers release.'
    ],output:['Fitted rim + support plane','Estimated minimum clearance: 7.3 mm','Adjust → lower → release → verify']},
    bottle:{title:'Turn the fitted axis upright',code:"a = np.r_[r.x[2:4], 1]\na /= np.linalg.norm(a)\nrot,_ = R.align_vectors([[0,0,1]],[a])\ntarget = rot * R.from_matrix(\n    np.array(o['poses']['right']['matrix'])\n    [:3,:3])",copy:[
      'The right member fits a cylinder to wrist-camera depth points, estimating the bottle’s axis in the robot base frame.',
      'The agent computes a rotation from the fitted axis to vertical and applies it to the current wrist orientation.',
      'The next motion command corrects the bottle’s tilt before placement on the tray.'
    ],output:['Estimated tilt from vertical: 7.2°','Fitted axis → corrective wrist rotation','Correct orientation → place upright']},
    carton:{title:'Track motion to check the lift',code:'q,s,e = cv2.calcOpticalFlowPyrLK(\n    a,b,pts,None)\nq = q[s.astype(bool)].reshape(-1,2)\nP = T @ np.r_[\n    np.linalg.inv(K)@[x,y,1]*z, 1]\nv.append(P[:3])',stages:['Observe','Analyze','Revise'],copy:[
      'After a 20 mm lift command, depth at fixed image locations barely changes. The lead initially suspects that the carton slipped.',
      'While the lead controls both arms, the right member tracks printed carton features and backprojects their depth into 3D.',
      'The tracked features rise by about 19 mm. The lead accepts the member’s evidence and revises its slip diagnosis.'
    ],output:['Commanded lift: 20 mm','23 feature matches → estimated rise ≈ 19 mm','The carton moved with the grippers.']}
  };
  let example='flower',step=0;
  function diagram(){
    const descriptions={flower:'Geometric model of flower-tip localization and insertion',basket:'Geometric model of basket pose, clearance and placement',bottle:'Fitted bottle axis and corrective wrist rotation',carton:'Carton feature tracking checks the commanded lift'};
    const start='<svg viewBox="0 0 460 300" role="img" aria-label="'+descriptions[example]+'"><defs><marker id="model-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0 0 7 3.5 0 7" fill="none" stroke="currentColor" stroke-width="1.3"/></marker></defs>';
    const label=(x,y,text,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${text}</text>`;
    let s='';
    if(example==='flower'&&step<2){
      s='<path class="model-ray before" d="M65 220L270 170"/><path class="model-ray after" d="M65 220L275 55"/><rect x="43" y="208" width="25" height="24" rx="4" class="model-camera"/><circle cx="55" cy="220" r="5" class="model-camera-lens"/><circle cx="270" cy="170" r="6" class="model-before"/><circle cx="275" cy="55" r="6" class="model-after"/><path class="model-motion" d="M315 167V59" marker-end="url(#model-arrow)"/>';
      s+=label(20,265,'Fixed camera')+label(246,199,'Before')+label(252,33,'After')+label(328,112,'129 mm','model-measure');
      if(step===1)s+='<circle cx="275" cy="55" r="15" class="model-solution"/><path d="M275 55V170H270" class="model-constraint"/>'+label(30,115,'Two image rays','model-muted')+label(275,286,'Solve the two unknown depths','model-caption','middle');
      else s+=label(328,135,'hand rise','model-muted');
    }else if(example==='flower'){
      s='<path class="model-vase" d="M196 135C196 180 216 196 212 246Q265 262 318 246C314 196 334 180 334 135"/><ellipse class="model-rim" cx="265" cy="135" rx="69" ry="18"/><path class="model-constraint" d="M265 59V245"/><g class="model-insertion"><path class="model-stem" d="M265 90V204"/><circle cx="265" cy="204" r="5" class="model-after"/></g><path class="model-motion" d="M371 87V175" marker-end="url(#model-arrow)"/>';
      s+=label(68,54,'Fitted vase opening')+label(86,78,'radius ≈ 37 mm','model-muted')+label(340,207,'Lower in')+label(340,230,'steps')+label(265,286,'Check alignment before descent','model-caption','middle');
    }else if(example==='basket'){
      s='<path class="model-support" d="M144 237L326 237L367 264H103Z"/>';
      if(step<2){
        s+='<g class="model-basket"><path class="model-basket-side" d="M127 106L151 194L319 220L335 118"/><ellipse class="model-rim" cx="231" cy="111" rx="104" ry="29" transform="rotate(4 231 111)"/><path class="model-hidden" d="M151 194L319 220"/></g>';
        s+=label(44,58,'Fitted rim')+label(30,283,'Support plane','model-muted')+label(24,181,'Hidden')+label(24,202,'underside')+'<path class="model-leader" d="M106 190L151 199"/>';
        if(step===1){s+='<path class="model-motion" d="M333 220V237" marker-start="url(#model-arrow)" marker-end="url(#model-arrow)"/><g class="model-feature-points"><circle cx="145" cy="108" r="4"/><circle cx="197" cy="89" r="4"/><circle cx="260" cy="89" r="4"/><circle cx="317" cy="110" r="4"/></g>'+label(347,226,'≈ 7 mm','model-measure')+label(231,30,'Track motion in 3D','model-caption','middle');}
        else s+=label(231,30,'Represent the contact geometry','model-caption','middle');
      }else{
        s+='<g class="model-lowering"><path class="model-basket-side" d="M135 128L158 232H310L333 128"/><ellipse class="model-rim" cx="234" cy="128" rx="99" ry="26"/><path class="model-base" d="M158 232H310"/></g><path class="model-gripper" d="M97 137L73 137L73 187L97 187M371 137H395V187H371"/><path class="model-motion" d="M234 58V90" marker-end="url(#model-arrow)"/>';
        s+=label(234,35,'Lower and release','model-caption','middle')+label(234,286,'Verify support in a new observation','model-caption','middle');
      }
    }else if(example==='bottle'){
      const bottle='<path class="model-vase" d="M197 57H233V82L248 109V239Q248 249 238 249H192Q182 249 182 239V109L197 82Z"/><rect class="model-rim" x="196" y="50" width="38" height="10" rx="2"/>';
      if(step<2){
        s='<path class="model-constraint" d="M215 38V250"/><g transform="rotate(7.2 215 250)">'+bottle+'<path class="model-stem" d="M215 47V249"/>';
        if(step===0)s+='<g class="model-feature-points"><circle cx="193" cy="121" r="2.5"/><circle cx="239" cy="138" r="2.5"/><circle cx="189" cy="167" r="2.5"/><circle cx="234" cy="186" r="2.5"/><circle cx="197" cy="217" r="2.5"/></g>';
        s+='</g>'+label(195,30,'Vertical','model-muted','end')+label(282,155,'Fitted axis','model-caption');
        s+='<path class="model-leader" d="M271 150L232 130"/>';
        if(step===1)s+='<path class="model-motion" d="M296 105Q297 55 249 55" marker-end="url(#model-arrow)"/>'+label(313,70,'Correct wrist')+label(313,93,'orientation');
        s+=label(230,286,step===0?'Fit a cylinder to the depth points':'Align the fitted axis with vertical','model-caption','middle');
      }else{
        s='<ellipse class="model-support" cx="215" cy="254" rx="99" ry="17"/>'+bottle+'<path class="model-stem" d="M215 50V248"/>';
        s+=label(215,30,'Bottle upright','model-caption','middle')+label(230,286,'Place on the tray','model-caption','middle');
      }
    }else if(example==='carton'){
      const carton=(x,y)=>`<path class="model-basket-side" d="M${x} ${y+18}L${x+16} ${y}H${x+70}L${x+86} ${y+18}V${y+91}H${x}Z"/><path class="model-leader" d="M${x} ${y+18}H${x+86}M${x+16} ${y}V${y+18}"/>`;
      if(step<2){
        s='<rect class="model-frame" x="20" y="64" width="190" height="166" rx="8"/><rect class="model-frame" x="250" y="64" width="190" height="166" rx="8"/>'+carton(72,117)+carton(302,98);
        s+=label(115,44,'Before lift','','middle')+label(345,44,'After lift','','middle');
        if(step===0){
          s+='<path class="model-fixed-pixel" d="M104 170H126M115 159V181M334 170H356M345 159V181"/>';
          s+=label(230,266,'Sample depth at fixed pixels','model-caption','middle');
        }else{
          for(const [x,y] of [[96,159],[129,174],[141,191]])s+=`<circle class="model-before" cx="${x}" cy="${y}" r="4"/><circle class="model-after" cx="${x+230}" cy="${y-19}" r="4"/>`;
          s+='<path class="model-motion" d="M404 190V171" marker-end="url(#model-arrow)"/>';
          s+=label(230,266,'Follow the same printed features','model-caption','middle');
        }
      }else{
        s+=label(230,30,'Lead controls both arms','model-caption','middle')+carton(187,75);
        s+='<path class="model-gripper" d="M178 106H158V150H178M282 106H302V150H282"/><path class="model-motion" d="M329 163V101" marker-end="url(#model-arrow)"/>';
        s+=label(117,222,'Commanded lift','model-muted','middle')+label(117,248,'20 mm','model-measure','middle')+label(343,222,'Estimated carton rise','model-muted','middle')+label(343,248,'≈ 19 mm','model-measure','middle')+label(230,286,'Carton moved with the grippers','model-caption','middle');
      }
    }
    return start+s+'</svg>';
  }
  function renderExample(){
    const e=examples[example];
    document.querySelectorAll('[data-dataset]').forEach(b=>{const selected=b.dataset.dataset===example;b.classList.toggle('active',selected);b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;});
    document.querySelectorAll('[data-model-step]').forEach(b=>{const i=Number(b.dataset.modelStep),selected=i===step;b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;b.lastChild.textContent=' '+(e.stages||['Observe','Compute','Act and check'])[i];});
    $('.dataset-stage-tabs').setAttribute('aria-label',example==='carton'?'Reasoning about feedback':'Reasoning to action');
    $('.dataset-model figcaption').textContent=example==='carton'?'Geometric evidence':'Geometric model';
    $('#dataset-title').textContent=e.title;
    $('#dataset-code').textContent=e.code;
    $('.dataset-program').dataset.step=step;
    $('#dataset-output').textContent=e.output[step];
    $('#dataset-copy').textContent=e.copy[step];
    $('#dataset-model').dataset.step=step;
    $('#dataset-model').innerHTML=diagram();
  }
  function keyboardTabs(selector){const buttons=[...document.querySelectorAll(selector)];buttons.forEach((b,i)=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[j].click();buttons[j].focus();}));}
  document.querySelectorAll('[data-dataset]').forEach(b=>b.addEventListener('click',()=>{example=b.dataset.dataset;step=0;renderExample();}));
  document.querySelectorAll('[data-model-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.modelStep);renderExample();}));
  keyboardTabs('[data-dataset]');keyboardTabs('[data-model-step]');keyboardTabs('[data-study]');
  renderExample();
})();

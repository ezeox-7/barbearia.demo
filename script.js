/* Projeto de demonstração: dados fictícios somente em localStorage. */
(() => {
  'use strict';
  const KEY = 'barbearia-demo-v2';
  const money = v => Number(v).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
  const dateLabel = v => { const [y,m,d] = v.split('-'); return `${d}/${m}/${y}`; };
  function load(){try {const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch{return [];}}
  function save(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true;}catch{return false;}}
  const boxes = [...document.querySelectorAll('.servico-checkbox')];
  const total = document.getElementById('valor-total');
  const duration = document.getElementById('duracao-total');
  const calc = () => boxes.filter(x=>x.checked).reduce((a,x)=>({sum:a.sum+Number(x.dataset.preco),minutes:a.minutes+Number(x.dataset.minutos),names:[...a.names,x.value]}),{sum:0,minutes:0,names:[]});
  function update(){const c=calc();if(total)total.textContent=money(c.sum);if(duration)duration.textContent=`Duração estimada: ${c.minutes} min`;}
  boxes.forEach(x=>x.addEventListener('change',update));update();
  const form = document.getElementById('form-servicos');
  if(form){
    const date=document.getElementById('data');date.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
    form.addEventListener('submit',e=>{
      e.preventDefault();const feedback=document.getElementById('feedback');const c=calc();
      const d=date.value,t=document.getElementById('hora').value;
      const start=new Date(`${d}T${t}`);const end=new Date(start.getTime()+(c.minutes+15)*60000);
      if(!c.names.length){feedback.textContent='Selecione ao menos um serviço.';return;}
      if(!d||!t||!Number.isFinite(start.getTime())||start<=new Date()){feedback.textContent='Escolha um horário futuro.';return;}
      const entries=load();const overlap=entries.some(a=>{const s=new Date(`${a.date}T${a.time}`);const f=new Date(s.getTime()+(Number(a.minutes)+15)*60000);return start<f&&s<end;});
      if(overlap){feedback.textContent='Já existe uma simulação nesse intervalo neste navegador.';return;}
      entries.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),name:document.getElementById('nome').value.trim().slice(0,60),phone:document.getElementById('telefone').value.trim().slice(0,18),date:d,time:t,services:c.names,price:c.sum,minutes:c.minutes});
      if(!save(entries)){feedback.textContent='Não foi possível salvar no navegador.';return;}
      form.reset();boxes.forEach(x=>x.checked=false);update();feedback.textContent='Simulação salva neste navegador! Consulte a agenda de teste.';
    });
  }
  const list=document.getElementById('lista-agendamentos');
  function render(){if(!list)return;list.replaceChildren();const entries=load().sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));if(!entries.length){const p=document.createElement('p');p.className='empty';p.textContent='Nenhuma simulação cadastrada neste navegador.';list.append(p);return;}
    entries.forEach(a=>{const item=document.createElement('article');item.className='agenda-item';const info=document.createElement('div');const heading=document.createElement('h3');heading.textContent=a.name;const detail=document.createElement('p');detail.textContent=`${dateLabel(a.date)} às ${a.time} · ${a.minutes} min`;const sv=document.createElement('p');sv.textContent=Array.isArray(a.services)?a.services.join(' · '):'';const val=document.createElement('p');val.textContent=`Total estimado: ${money(a.price)}`;info.append(heading,detail,sv,val);const remove=document.createElement('button');remove.className='btn secondary small';remove.type='button';remove.textContent='Excluir';remove.addEventListener('click',()=>{if(confirm('Excluir esta simulação?')){save(load().filter(x=>x.id!==a.id));render();}});item.append(info,remove);list.append(item);});}
  render();document.getElementById('limpar-agenda')?.addEventListener('click',()=>{if(confirm('Excluir todas as simulações deste navegador?')){save([]);render();}});
})();

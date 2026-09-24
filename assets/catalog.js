(() => {
  const STORE={whatsapp:'5535991409447',name:'Mais Phone Lavras'};
  const phoneModels=['iPhone 17 Pro Max','iPhone 17 Pro','iPhone 17','iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16','iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15','iPhone 14','iPhone 13'];
  const products=[
    ...phoneModels.map((name,index)=>({id:`iphone-${index+1}`,name,category:'iphone',conditions:['novo','seminovo'],image:index<2?'iphone-pro-used.png':index===2?'iphone-17.jpg':'iphone-air.jpg',width:index<2?1536:3456,height:index<2?1024:1824,description:'Modelo para consulta. Confirme versão, estado, armazenamento e disponibilidade diretamente com a equipe.'})),
    {id:'airpods',name:'AirPods',category:'audio',conditions:[],image:'airpods-pro.jpg',width:542,height:614,description:'Consulte modelos de fones, compatibilidade e disponibilidade.'},
    {id:'apple-watch',name:'Apple Watch',category:'relogio',conditions:[],image:'apple-watch.svg',width:480,height:560,description:'Consulte modelos, tamanhos, cores e compatibilidade.'},
    {id:'acessorios',name:'Capas e acessórios',category:'acessorio',conditions:[],image:'phone-accessories.svg',width:480,height:560,description:'Consulte itens disponíveis e compatíveis com seu aparelho.'}
  ];
  const filters={category:'all',query:''};
  const grid=document.getElementById('productGrid');
  const dialog=document.getElementById('productDialog');
  const dialogContent=document.getElementById('dialogContent');
  const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const wa=message=>`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
  const message=product=>`Olá! Vi o ${product.name} no site da ${STORE.name} e gostaria de consultar disponibilidade, cores e condições de pagamento.`;
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function card(product){
    const label=product.conditions.length?'Consulte condição e disponibilidade':'Consulte disponibilidade';
    return `<article class="product-card reveal" data-product-id="${safe(product.id)}"><div class="product-media"><img src="assets/${safe(product.image)}" alt="Imagem ilustrativa para consulta de ${safe(product.name)}; confirme o modelo real com a loja." width="${product.width}" height="${product.height}" loading="lazy" decoding="async"></div><div class="product-body"><span class="product-meta">${label}</span><h2>${safe(product.name)}</h2><p>${safe(product.description)}</p><p class="product-price">Consulte o valor</p><div class="product-actions"><button class="button button-outline" type="button" data-open-product="${safe(product.id)}">Ver detalhes</button><a class="button button-dark" href="${safe(wa(message(product)))}" target="_blank" rel="noopener noreferrer">Consultar no WhatsApp</a></div></div></article>`;
  }
  function render(){
    const shown=products.filter(product=>{
      const category=filters.category==='all'||product.category===filters.category||product.conditions.includes(filters.category);
      return category&&normalize(`${product.name} ${product.category}`).includes(normalize(filters.query));
    });
    grid.innerHTML=shown.map(card).join('');
    document.getElementById('resultsCount').textContent=`${shown.length} ${shown.length===1?'produto para consulta':'produtos para consulta'}`;
    document.getElementById('emptyState').hidden=shown.length>0;
    reveal();
  }
  function setCategory(category){
    filters.category=category;
    document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===category;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    render();
  }
  function reveal(){
    const elements=[...document.querySelectorAll('.reveal:not(.is-visible)')];
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver'in window)){elements.forEach(element=>element.classList.add('is-visible'));return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12});
    elements.forEach((element,index)=>{element.style.setProperty('--delay',`${Math.min(index*45,270)}ms`);observer.observe(element);});
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>setCategory(button.dataset.filter)));
  document.getElementById('productSearch').addEventListener('input',event=>{filters.query=event.target.value.trim();render();});
  document.getElementById('clearFilters').addEventListener('click',()=>{document.getElementById('productSearch').value='';filters.query='';setCategory('all');});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-open-product]');if(!button)return;
    const product=products.find(item=>item.id===button.dataset.openProduct);if(!product)return;
    dialogContent.innerHTML=`<div class="dialog-media"><img src="assets/${safe(product.image)}" alt="Imagem ilustrativa de ${safe(product.name)}" width="${product.width}" height="${product.height}"></div><div class="dialog-copy"><span class="product-meta">${product.conditions.length?'Condição a confirmar':'Consulte disponibilidade'}</span><h2 id="dialogTitle">${safe(product.name)}</h2><p>${safe(product.description)}</p><dl><div><dt>Condição</dt><dd>${product.conditions.length?'Novo ou seminovo — confirmar':'Consultar'}</dd></div><div><dt>Armazenamento e cores</dt><dd>Consulte as opções disponíveis</dd></div><div><dt>Valor e pagamento</dt><dd>Confirme as condições com a loja</dd></div><div><dt>Garantia</dt><dd>Confirme os termos desta unidade</dd></div></dl><a class="button button-dark" href="${safe(wa(message(product)))}" target="_blank" rel="noopener noreferrer">Consultar este produto no WhatsApp ↗</a></div>`;
    dialog.showModal();
  });
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  const menu=document.getElementById('menuBtn'),nav=document.getElementById('navLinks');
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');menu.textContent=open?'×':'☰';});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';}));
  const requested=new URLSearchParams(location.search).get('categoria');
  const allowed=['all','novo','seminovo','iphone','audio','relogio','acessorio'];
  if(allowed.includes(requested))setCategory(requested);else render();
})();

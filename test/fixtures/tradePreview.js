import { build, stop } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const fixture = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faSpinner,faSearch,faCaretDown,faCheckCircle,faUser,faClock,faGift,faCoins,faArrowUp,faArrowDown,faLaptopCode,faUsers,faCardsBlank,faEye,faTimes,faXmark,faCheck,faSparkles,faRedo,faRightLeft,faChevronDown,faChevronUp,faChevronRight} from '@fortawesome/pro-solid-svg-icons';
import AppTransferModal from './src/components/Build/AppTransferModal';
import TransactionModal from './src/containers/Chat/Modals/TransactionModal';
import TransactionDetails from './src/containers/Chat/TransactionDetails';
import SelectBuildsModal from './src/containers/Chat/Modals/TransactionModal/SelectBuildsModal';
import SelectGroupsModal from './src/containers/Chat/Modals/TransactionModal/SelectGroupsModal';
import SelectAICardModal from './src/components/Modals/SelectAICardModal';
import Modal from './src/components/Modal';
import CardThumb from './src/components/CardThumb';
library.add(faSpinner,faSearch,faCaretDown,faCheckCircle,faUser,faClock,faGift,faCoins,faArrowUp,faArrowDown,faLaptopCode,faUsers,faCardsBlank,faEye,faTimes,faXmark,faCheck,faSparkles,faRedo,faRightLeft,faChevronDown,faChevronUp,faChevronRight);
window.viewer=1; localStorage.setItem('userId','1'); localStorage.setItem('username','Orbit'); localStorage.setItem('token','local-preview');
window.posts=[];window.accepts=[];window.coinUpdates=[];window.handoffs=[];window.serverCoins=5000;
window.addEventListener('twinkle:build-ownership-changed',e=>window.handoffs.push(e.detail));
const artwork='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><rect width="240" height="160" rx="12" fill="#122744"/><circle cx="160" cy="45" r="22" fill="#e8dba2"/><path d="M0 123 Q70 78 130 123 T260 100 V160 H0Z" fill="#347673"/><path d="M0 148 Q110 84 240 141 V160 H0Z" fill="#163e52"/><g fill="#b7d8c0"><circle cx="52" cy="95" r="5"/><circle cx="83" cy="115" r="5"/><circle cx="142" cy="126" r="6"/></g></svg>');
window.app={id:21,userId:1,title:'Moon Garden',thumbnailUrl:artwork,isPublic:1,username:'Orbit',creatorId:7,creatorUsername:'Luna'};
window.apps=[window.app,...['Sky Voyager','Mini Monster Arena','The Moon Garden: A Very Long App Name With An Extended Adventure Edition','AI Story Library','Stickman Kickboxing','Command Nexus','Private Studio'].map((title,index)=>({...window.app,id:20-index,title,isPublic:index===6?0:1,thumbnailUrl:index===4?null:artwork}))];
window.group={id:90,creator:1,channelName:'Stargazers Guild',isPublic:true,pathId:10090,members:[],allMemberIds:[1,4,5,6,7,8,9,10]};
window.groups=[window.group,...['The Long-Named Stargazers Guild and Creative Coding Community','Design Circle','Night Owls','Builders Club','Game Studio','Weekend Adventures'].map((channelName,index)=>({...window.group,id:89-index,channelName}))];
window.cards={41:{id:41,ownerId:2,word:'Aurora Phoenix',level:4,quality:'legendary',isLive:1,isBurned:0},42:{id:42,ownerId:1,word:'Moonlit Fox',level:2,quality:'rare',isLive:1,isBurned:0}};
Object.assign(window.cards,Object.fromEntries(Array.from({length:10},(_,index)=>{const id=50+index;return [id,{...window.cards[42],id,word:'Star Explorer '+(index+1),lastInteraction:id}]}))); window.cards[42].lastInteraction=42;
window.makePending=()=>({id:71,type:'trade',from:2,to:1,timeStamp:1791400000,offer:{coins:0,cardIds:[41],cards:[window.cards[41]],groupIds:[],groups:[],buildIds:[],builds:[]},want:{coins:1500,cardIds:[],cards:[],groupIds:[90],groups:[window.group],buildIds:[21],builds:[window.app]}});
window.pending=window.makePending();
window.receipts={
 completed:{...window.makePending(),id:72,isAccepted:true},
 pending:window.pending,
 gift:{...window.makePending(),id:73,type:'send',from:1,to:2,offer:{coins:0,cardIds:[],groupIds:[],buildIds:[21],builds:[window.app]},want:{}},
 giftReceived:{...window.makePending(),id:77,type:'send',from:2,to:1,offer:{coins:0,cardIds:[],groupIds:[],buildIds:[21],builds:[window.app]},want:{}},
 withdrawn:{...window.makePending(),id:74,isCancelled:true,cancelReason:'withdraw'},
 declined:{...window.makePending(),id:75,isCancelled:true,cancelReason:'decline'},
 showcase:{...window.makePending(),id:76,type:'show',from:1,to:2,offer:{coins:0,cardIds:[42],cards:[window.cards[42]],groupIds:[],buildIds:[21],builds:[window.app]},want:{}}
};
window.requests={
 loadPendingTransaction:async()=>({transaction:structuredClone(window.pending)}),
 loadBuildsForTrade:async({type,search,lastId})=>{const matches=type==='offer'?window.apps.filter(app=>(!lastId||app.id<lastId)&&(!search||app.title.toLowerCase().includes(search.toLowerCase()))):[];return {results:matches.slice(0,5),loadMoreShown:matches.length>5};},
 loadGroupsForTrade:async({type,lastId})=>{const matches=type==='offer'?window.groups.filter(group=>!lastId||group.id<lastId):[];return {results:matches.slice(0,3),loadMoreShown:matches.length>3};},
 searchGroupsForTrade:async({type,searchQuery,lastId})=>{const matches=type==='offer'?window.groups.filter(group=>(!lastId||group.id<lastId)&&group.channelName.toLowerCase().includes(searchQuery.toLowerCase())):[];return {results:matches.slice(0,3),loadMoreShown:matches.length>3};},
 loadFilteredAICards:async({filters,lastId})=>{const owner=filters.owner==='Nova'?2:1;const matches=Object.values(window.cards).filter(card=>card.ownerId===owner&&(!lastId||card.id<lastId)).sort((a,b)=>b.id-a.id);return {cards:matches.slice(0,6),loadMoreShown:matches.length>6};},
 searchUsers:async text=>'nova'.includes(text.toLowerCase())?[{id:2,username:'Nova'}]:[],
 postTradeRequest:async payload=>{window.posts.push(payload);if(window.failNext){window.failNext=false;throw {response:{data:{error:'The app is busy. Wait for Lumine to finish, then try again.'}}};}window.serverCoins=3500;return {coins:3500,isNewChannel:false,newChannelId:20,pathId:10020};},
 checkTransactionPossible:async()=>({isDisabled:false}),
 acceptTrade:async payload=>{window.accepts.push(payload);window.serverCoins=3500;return {coins:3500,channelId:20};},
 loadCoins:async()=>window.serverCoins,
 closeTransaction:async({cancelReason})=>({cancelReason}),
 loadAICard:async id=>({card:window.cards[id]}),
 checkChatAccessible:async()=>({isAccessible:false,isPublic:false})
};
function Fixture(){const [receiptKey,setReceiptKey]=useState('completed'),[mode,setMode]=useState(['messages','apps','groups','cards'].includes(new URLSearchParams(location.search).get('view'))?new URLSearchParams(location.search).get('view'):'pending'),[revision,setRevision]=useState(0),[groups,setGroups]=useState({90:window.group}),[cardId,setCardId]=useState(0);
 window.openFixture=(next,viewer=1)=>{window.viewer=viewer;localStorage.setItem('userId',String(viewer));setCardId(0);setMode(next);setRevision(v=>v+1);};
 return <main><div className="preview-brand">✦ <b>Twinkle</b><span>TRADE ROOM</span></div><p className="preview-tag">Interactive preview · Example accounts · No real transfers</p><h1>{mode==='messages'?'The trade, in your chat.':<>A trade you can read<br/>at a glance.</>}</h1><p className="preview-lead">Coins, cards, communities and creations.<br/>Two clear sides. One exact agreement.</p><nav><button onClick={()=>{window.pending=window.makePending();window.openFixture('pending')}}>Mixed trade example</button><button onClick={()=>window.openFixture('chat')}>Start a new offer</button><button onClick={()=>window.openFixture('app')}>Sell or give an app</button><button onClick={()=>window.openFixture('messages')}>Chat messages</button><button onClick={()=>window.openFixture('apps')}>App picker</button><button onClick={()=>window.openFixture('groups')}>Group picker</button><button onClick={()=>window.openFixture('cards')}>Card picker</button></nav>
 {mode==='messages'&&<section className="preview-chat" aria-label="Chat message preview">
 <nav aria-label="Message examples">{[['completed','Completed trade'],['pending','Pending offer'],['gift','Gift sent'],['giftReceived','Gift received'],['withdrawn','Withdrawn'],['declined','Declined'],['showcase','Showcase']].map(([key,label])=><button key={key} aria-pressed={receiptKey===key} onClick={()=>setReceiptKey(key)}>{label}</button>)}</nav>
 <div className="chat-heading"><span className="avatar">N</span><div><strong>Nova</strong><p>Your conversation</p></div></div>
 <div className="chat-stream"><p className="chat-bubble">The app and the guild, plus 1,500 coins for my Phoenix?</p>
 <TransactionDetails transaction={window.receipts[receiptKey]} currentTransactionId={receiptKey==='giftReceived'?77:71} partner={{id:2,username:'Nova'}} groupObjs={groups} onSetGroupObjs={setGroups} isAICardModalShown={!!cardId} onSetAICardModalCardId={setCardId} onClick={receiptKey==='pending'||receiptKey==='giftReceived'?()=>{window.pending=window.receipts[receiptKey];window.openFixture('pending');}:undefined}/>
 </div></section>}
 <aside><strong>Try the new flow</strong><p>Counteroffer to edit either side. Review the exact exchange before accepting. Switch to Give a gift when you expect nothing back.</p></aside>
 {mode==='apps'&&<SelectBuildsModal type="offer" partnerId={2} selected={[]} onHide={()=>setMode(null)} onDone={items=>{window.selectedApps=items;setMode(null)}}/>}
 {mode==='groups'&&<SelectGroupsModal type="offer" partner={{id:2,username:'Nova'}} currentlySelectedGroupIds={[]} groupObjs={groups} onSetGroupObjs={setGroups} onHide={()=>setMode(null)} onSelectDone={ids=>{window.selectedGroups=ids;setMode(null)}}/>}
 {mode==='cards'&&<SelectAICardModal aiCardModalType="offer" partner={{id:2,username:'Nova'}} currentlySelectedCardIds={[]} onDropdownShown={()=>{}} onSetAICardModalCardId={setCardId} onHide={()=>setMode(null)} onSelectDone={ids=>{window.selectedCards=ids;setMode(null)}}/>}
 {mode==='app'&&<AppTransferModal key={revision} build={window.app} onHide={()=>setMode(null)}/>}
 {(mode==='chat'||mode==='pending')&&<TransactionModal key={revision} channelId={mode==='pending'?20:0} currentTransactionId={mode==='pending'?window.pending?.id:0} partner={{id:window.viewer===1?2:1,username:window.viewer===1?'Nova':'Orbit'}} groupObjs={groups} onSetGroupObjs={setGroups} isAICardModalShown={!!cardId} onSetAICardModalCardId={setCardId} onHide={()=>setMode(null)}/>}
 {!!cardId&&<Modal modalKey="PreviewCardDetails" isOpen modalLevel={3} title="Inspect AI card" onClose={()=>setCardId(0)}><div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem'}}><CardThumb detailed card={window.cards[cardId]}/><p>Preview card #{cardId} · {window.cards[cardId]?.word}</p></div></Modal>}
 </main>;
}createRoot(document.getElementById('root')).render(<MemoryRouter><Fixture/></MemoryRouter>);
`;

export async function createTradePreviewPage() {
  const stubs = {
    '~/contexts': `
      const actions=new Proxy({}, {get:(target,key)=>target[key] ||= (payload=>{if(key==='onUpdateAICard')window.cards[payload.cardId]={...window.cards[payload.cardId],...payload.newState};})});
      export const useKeyContext=select=>select({myState:{userId:window.viewer,username:window.viewer===1?'Orbit':'Nova',twinkleCoins:window.serverCoins,profileTheme:'logoBlue'},theme:new Proxy({done:{color:'logoBlue'},success:{color:'green'}},{get:(t,k)=>t[k]||{color:'logoBlue'}})});
      export const useAppContext=select=>select({requestHelpers:window.requests,user:{state:{userObj:{},myState:{}},actions:{onSetUserState:entry=>window.coinUpdates.push(entry)}}});
      export const useChatContext=select=>select({actions,state:{cardObj:window.cards,acceptedTransactions:{},cancelledTransactions:{},channelPathIdHash:{},chatStatus:{},userOnlineHash:{},userAwayHash:{}}});
      export const useHomeContext=select=>select({state:{},actions});
      export const useContentContext=useHomeContext;
      export const useProfileContext=useHomeContext;
      export const useNotiContext=useHomeContext;
    `,
    '~/helpers':
      'export const isMobile=()=>innerWidth<600;export const isTablet=()=>false;export const isPhone=()=>innerWidth<600;export const throttle=fn=>fn;export const objectify=rows=>Object.fromEntries(rows.map(row=>[row.id,row]));',
    '~/constants/sockets/api': 'export const socket={on(){},off(){},emit(){}};',
    '~/components/ErrorBoundary':
      'export default ({children,innerRef,componentPath,...props})=>Object.keys(props).length?<div ref={innerRef} {...props}>{children}</div>:<>{children}</>;',
    '~/components/Loading': 'export default ()=> <p>Loading…</p>;',
    '~/components/Texts/UsernameText':
      'export default ({user,textStyle,displayedName})=><span style={textStyle}>{displayedName||user.username}</span>;',
    '~/components/Modals/AICardModal': 'export default ()=>null;'
  };
  try {
    const result = await build({
      stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'automatic',
      alias: {
        '~': path.join(repo, 'src'),
        // as in vite.config.ts (the shared AI card embed uses it)
        'react-sanitized-html': path.join(
          repo,
          'src/shims/react-sanitized-html.tsx'
        )
      },
      loader: { '.webp': 'dataurl', '.gif': 'dataurl', '.png': 'dataurl' },
      define: {
        'import.meta.env': '{}',
        'process.env.NODE_ENV': '"development"'
      },
      plugins: [
        {
          name: 'trade-preview-data',
          setup(builder) {
            builder.onResolve({ filter: /.*/ }, ({ path }) =>
              Object.hasOwn(stubs, path)
                ? { path, namespace: 'fixture' }
                : undefined
            );
            builder.onLoad(
              { filter: /.*/, namespace: 'fixture' },
              ({ path }) => ({
                contents: stubs[path],
                loader: 'jsx',
                resolveDir: repo
              })
            );
          }
        }
      ]
    });
    const styles = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
    return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Twinkle · Trade interface preview</title><style>${styles}
      html,body{position:static;height:auto;overflow:auto}body{margin:0;background:#edf2f7;color:#24334a;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}main{max-width:1080px;margin:0 auto;padding:48px 32px}.preview-brand{display:flex;align-items:center;gap:10px;font-size:26px;color:#2b609e}.preview-brand span{font-size:10px;letter-spacing:2px;margin-left:12px;color:#7890aa}.preview-tag{font-size:12px;color:#647b92;margin:24px 0 56px}h1{font-size:52px;letter-spacing:-2px;line-height:1.08;margin:0 0 24px}.preview-lead{font-size:18px;color:#657c93;line-height:1.6}main>nav{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}main>nav button{border:1px solid #c8d5e5;border-radius:10px;background:white;padding:12px 18px;color:#315b8e;font-size:14px;font-weight:700;cursor:pointer}aside{max-width:400px;margin-top:60px;font-size:13px;color:#71859b;line-height:1.6}aside strong{color:#395775}@media(max-width:600px){main{padding:26px 20px}h1{font-size:38px}.preview-tag{margin-bottom:36px}}
      main:has(.preview-chat){padding-top:24px}main:has(.preview-chat) .preview-tag{margin:12px 0 24px}main:has(.preview-chat) h1{font-size:30px;letter-spacing:-1px;margin-bottom:0}main:has(.preview-chat) .preview-lead{display:none}main:has(.preview-chat)>nav{margin-top:20px}.preview-chat{margin-top:24px;max-width:800px;background:#f5f8fc;border:1px solid #d0dce9;border-radius:18px;overflow:hidden}.preview-chat>nav{display:flex;flex-wrap:wrap;padding:16px;margin:0;gap:8px;border-bottom:1px solid #dce4ee}.preview-chat>nav button{border:1px solid #c8d5e5;border-radius:8px;background:#fff;color:#315b8e;padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer}.preview-chat>nav button[aria-pressed=true]{background:#315b91;color:#fff}.chat-heading{display:flex;gap:12px;align-items:center;padding:20px;background:#fff;border-bottom:1px solid #dce4ee;font-size:16px}.chat-heading p{font-size:12px;color:#7c8aa0;margin:4px 0 0}.avatar{display:grid;place-items:center;border-radius:50%;background:#dce7f6;color:#315b91;width:40px;height:40px;font-weight:800}.chat-stream{padding:18px}.chat-bubble{display:inline-block;background:#e5ecf5;padding:12px 16px;border-radius:14px;font-size:13px;color:#456080}@media(max-width:600px){.chat-stream{padding:8px}.preview-chat{margin-top:20px}main:has(.preview-chat){padding:18px 8px}}
      </style></head><body><div id="root"></div><script>${result.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
  } finally {
    stop();
  }
}
